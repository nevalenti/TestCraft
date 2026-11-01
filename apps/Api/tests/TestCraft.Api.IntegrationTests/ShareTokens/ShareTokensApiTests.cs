using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.ShareTokens;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Persistence;

namespace TestCraft.Api.IntegrationTests.ShareTokens;

[Collection(ApiCollection.Name)]
public class ShareTokensApiTests(ApiFactory factory)
{
    private HttpClient CreateClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );

        return client;
    }

    [Fact]
    public async Task Create_Then_GetAll_ReturnsToken()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
            new CreateShareToken.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<CreateShareTokenResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.TestRunId.Should().Be(run.Id);
        created.Token.Should().NotBeNullOrWhiteSpace();

        var listResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share"
        );
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var tokens = await listResponse.Content.ReadFromJsonAsync<
            IReadOnlyList<ShareTokenResponse>
        >(ApiTestHelpers.JsonOptions);
        tokens.Should().ContainSingle(token => token.Id == created.Id);
        (await listResponse.Content.ReadAsStringAsync()).Should().NotContain(created.Token);

        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await context.ShareTokens.SingleAsync(token => token.Id == created.Id);
        stored.TokenHash.Should().HaveLength(64).And.NotBe(created.Token);
    }

    [Fact]
    public async Task GetByToken_PublicEndpoint_ReturnsRunSummary()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, "Public Run");

        var shareResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
            new CreateShareToken.Command()
        );

        var shareToken = await shareResponse.Content.ReadFromJsonAsync<CreateShareTokenResponse>(
            ApiTestHelpers.JsonOptions
        );

        var publicClient = factory.CreateClient();
        var response = await publicClient.GetAsync($"/api/v1/share/{shareToken!.Token}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var shared = await response.Content.ReadFromJsonAsync<SharedRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        shared!.RunName.Should().Be("Public Run");
    }

    [Fact]
    public async Task GetByToken_PagesResultsButKeepsWholeRunSummary()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var suite = await owner.CreateSuiteAsync(project.Id);
        var run = await owner.CreateRunAsync(project.Id);
        var firstCase = await owner.CreateCaseAsync(project.Id, suite.Id, "First");
        var secondCase = await owner.CreateCaseAsync(project.Id, suite.Id, "Second");
        var thirdCase = await owner.CreateCaseAsync(project.Id, suite.Id, "Third");
        await owner.CreateResultAsync(project.Id, run.Id, firstCase.Id, TestResultStatus.Passed);
        await owner.CreateResultAsync(project.Id, run.Id, secondCase.Id, TestResultStatus.Failed);
        await owner.CreateResultAsync(project.Id, run.Id, thirdCase.Id, TestResultStatus.Passed);
        await owner.CreateResultAsync(project.Id, run.Id, firstCase.Id, TestResultStatus.Failed);

        var share = await (
            await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
                new CreateShareToken.Command()
            )
        ).Content.ReadFromJsonAsync<CreateShareTokenResponse>(ApiTestHelpers.JsonOptions);
        var client = factory.CreateClient();
        var path = $"/api/v1/share/{share!.Token}";

        var first = await (
            await client.GetAsync($"{path}?page=1&page_size=2")
        ).Content.ReadFromJsonAsync<SharedRunResponse>(ApiTestHelpers.JsonOptions);
        var second = await (
            await client.GetAsync($"{path}?page=2&page_size=2")
        ).Content.ReadFromJsonAsync<SharedRunResponse>(ApiTestHelpers.JsonOptions);
        var wider = await (
            await client.GetAsync($"{path}?page=1&page_size=3")
        ).Content.ReadFromJsonAsync<SharedRunResponse>(ApiTestHelpers.JsonOptions);

        first!.Results.Should().HaveCount(2);
        second!.Results.Should().HaveCount(1);
        wider!.Results.Should().HaveCount(3);
        var visibleResults = first.Results.Concat(second.Results).ToList();
        visibleResults
            .Select(result => result.TestCaseName)
            .Should()
            .BeEquivalentTo("First", "Second", "Third");
        visibleResults
            .Single(result => result.TestCaseName == "First")
            .Status.Should()
            .Be(TestResultStatus.Failed);
        first.ResultsTotal.Should().Be(3);
        second.ResultsTotal.Should().Be(3);
        first.Total.Should().Be(3);
        second.Passed.Should().Be(1);
        second.Failed.Should().Be(2);
        second.Page.Should().Be(2);
        second.PageSize.Should().Be(2);

        (await client.GetAsync($"{path}?page=0&page_size=2"))
            .StatusCode.Should()
            .Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task GetByToken_InvalidToken_ReturnsNotFound()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/share/invalid-token-abc");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Revoke_RemovesToken()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
                new CreateShareToken.Command()
            )
        ).Content.ReadFromJsonAsync<CreateShareTokenResponse>(ApiTestHelpers.JsonOptions);
        var publicClient = factory.CreateClient();
        (await publicClient.GetAsync($"/api/v1/share/{created!.Token}"))
            .StatusCode.Should()
            .Be(HttpStatusCode.OK);

        var revokeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share/{created.Id}"
        );
        revokeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await publicClient.GetAsync($"/api/v1/share/{created.Token}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task ExpiredTokenCleanup_DeletesTokensForDeletedProjects()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var run = await owner.CreateRunAsync(project.Id);
        var path = $"/api/v1/projects/{project.Id}/runs/{run.Id}/share";
        var expired = await (
            await owner.PostAsJsonAsync(
                path,
                new CreateShareToken.Command { ExpiresAt = DateTimeOffset.UtcNow.AddHours(-1) }
            )
        ).Content.ReadFromJsonAsync<CreateShareTokenResponse>(ApiTestHelpers.JsonOptions);
        var current = await (
            await owner.PostAsJsonAsync(
                path,
                new CreateShareToken.Command { ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) }
            )
        ).Content.ReadFromJsonAsync<CreateShareTokenResponse>(ApiTestHelpers.JsonOptions);

        (await owner.DeleteAsync($"/api/v1/projects/{project.Id}"))
            .StatusCode.Should()
            .Be(HttpStatusCode.NoContent);

        using var scope = factory.Services.CreateScope();
        var job = scope.ServiceProvider.GetRequiredService<ExpiredShareTokenCleanupJob>();
        await job.RunAsync(CancellationToken.None);

        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tokenIds = await context
            .ShareTokens.IgnoreQueryFilters()
            .Where(token => token.TestRunId == run.Id)
            .Select(token => token.Id)
            .ToListAsync();
        tokenIds.Should().NotContain(expired!.Id).And.Contain(current!.Id);
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        var run = await owner.CreateRunAsync(project.Id);

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/share");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Migration_HashesExistingTokensWithoutBreakingSavedLinks()
    {
        using var scope = factory.Services.CreateScope();
        var currentContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var databaseName = $"legacy_shares_{Guid.NewGuid():N}";
        var connection = new NpgsqlConnectionStringBuilder(
            currentContext.Database.GetDbConnection().ConnectionString
        );
        var adminConnection = new NpgsqlConnectionStringBuilder(connection.ConnectionString)
        {
            Database = "postgres",
            Pooling = false,
        };
        await using var admin = new NpgsqlConnection(adminConnection.ConnectionString);
        await admin.OpenAsync();

        await using (var create = new NpgsqlCommand($"CREATE DATABASE {databaseName}", admin))
        {
            await create.ExecuteNonQueryAsync();
        }

        try
        {
            connection.Database = databaseName;
            connection.Pooling = false;
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connection.ConnectionString)
                .Options;
            await using var context = new AppDbContext(
                options,
                scope.ServiceProvider.GetRequiredService<IPublisher>(),
                TimeProvider.System
            );
            await context.Database.MigrateAsync("20261022095950_AddTestRunVersion");

            var projectId = Guid.NewGuid();
            var runId = Guid.NewGuid();
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO projects (id, name, user_id) VALUES ({projectId}, 'Legacy links', {Guid.NewGuid()})"
            );
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO test_runs (id, project_id, name, environment, status, version) VALUES ({runId}, {projectId}, 'Legacy run', 'ci', 'Active', 1)"
            );

            const string rawToken = "saved-link-token-value";
            var tokenId = ShareTokenId.New();
            await context.Database.ExecuteSqlInterpolatedAsync(
                $"INSERT INTO share_tokens (id, test_run_id, token, created_by_id, created_at) VALUES ({tokenId.Value}, {runId}, {rawToken}, {Guid.NewGuid()}, {DateTimeOffset.UtcNow})"
            );

            await context.Database.MigrateAsync();

            var stored = await context.ShareTokens.SingleAsync(token => token.Id == tokenId);
            var hasher = scope.ServiceProvider.GetRequiredService<IApiTokenHasher>();
            stored.TokenHash.Should().Be(hasher.Hash(rawToken));
        }
        finally
        {
            await using var drop = new NpgsqlCommand(
                $"DROP DATABASE {databaseName} WITH (FORCE)",
                admin
            );
            await drop.ExecuteNonQueryAsync();
        }
    }
}
