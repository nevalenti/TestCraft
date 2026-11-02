using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.Errors;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.ApiTokens;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.ApiTokens;

[Collection(ApiCollection.Name)]
public class ApiTokensApiTests(ApiFactory factory)
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
    public async Task Create_ReturnsRawTokenOnce()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "CI Token", Scopes = [ApiTokenScope.RunsWrite] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<CreateApiTokenResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Name.Should().Be("CI Token");
        created.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetAll_ListsTokensWithoutRawValue()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "My Token", Scopes = [ApiTokenScope.RunsWrite] }
        );

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var tokens = await response.Content.ReadFromJsonAsync<IReadOnlyList<ApiTokenResponse>>(
            ApiTestHelpers.JsonOptions
        );
        tokens.Should().ContainSingle(token => token.Name == "My Token" && !token.IsRevoked);
        tokens!.Single().Scopes.Should().Equal(ApiTokenScope.RunsWrite);
    }

    [Fact]
    public async Task Revoke_MarksTokenRevoked()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command
                {
                    Name = "Revokable",
                    Scopes = [ApiTokenScope.RunsWrite],
                }
            )
        ).Content.ReadFromJsonAsync<CreateApiTokenResponse>(ApiTestHelpers.JsonOptions);

        var revokeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/tokens/{created!.Id}"
        );
        revokeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var tokens = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/tokens")
        ).Content.ReadFromJsonAsync<IReadOnlyList<ApiTokenResponse>>(ApiTestHelpers.JsonOptions);

        tokens.Should().ContainSingle(token => token.Id == created.Id && token.IsRevoked);
    }

    [Fact]
    public async Task Create_InvalidName_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "", Scopes = [ApiTokenScope.RunsWrite] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/tokens",
            new CreateApiToken.Command { Name = "Token", Scopes = [ApiTokenScope.RunsWrite] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ReadScope_AllowsReadsButBlocksWritesAndTokenManagement()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var created = await (
            await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command { Name = "Read runs", Scopes = [ApiTokenScope.RunsRead] }
            )
        ).Content.ReadFromJsonAsync<CreateApiTokenResponse>(ApiTestHelpers.JsonOptions);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            created!.Token
        );

        (await client.GetAsync($"/api/v1/projects/{project.Id}/runs"))
            .StatusCode.Should()
            .Be(HttpStatusCode.OK);
        var write = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRun.Command { Name = "Denied", Environment = "ci" }
        );
        write.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await write.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Detail.Should()
            .Be("This API token needs the runs_write scope");
        (await client.GetAsync($"/api/v1/projects/{project.Id}/suites"))
            .StatusCode.Should()
            .Be(HttpStatusCode.Forbidden);
        var tokens = await client.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        tokens.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await tokens.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Detail.Should()
            .Be("API tokens cannot use this endpoint");

        var listed = await (
            await owner.GetAsync($"/api/v1/projects/{project.Id}/tokens")
        ).Content.ReadFromJsonAsync<IReadOnlyList<ApiTokenResponse>>(ApiTestHelpers.JsonOptions);
        listed.Should().ContainSingle(token => token.Id == created.Id);
        listed!.Single().Scopes.Should().Equal(ApiTokenScope.RunsRead);
    }

    [Fact]
    public async Task WriteScope_AlsoAllowsReadingItsResource()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var created = await (
            await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command
                {
                    Name = "Write runs",
                    Scopes = [ApiTokenScope.RunsWrite],
                }
            )
        ).Content.ReadFromJsonAsync<CreateApiTokenResponse>(ApiTestHelpers.JsonOptions);
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            created!.Token
        );

        (await client.GetAsync($"/api/v1/projects/{project.Id}/runs"))
            .StatusCode.Should()
            .Be(HttpStatusCode.OK);
        (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs",
                new CreateTestRun.Command { Name = "Allowed", Environment = "ci" }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task SeparateTokens_DoNotShareIdempotencyKeys()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var path = $"/api/v1/projects/{project.Id}/runs";

        async Task<TestRunResponse> CreateRunAsTokenAsync(string token)
        {
            var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
                "Bearer",
                token
            );
            client.DefaultRequestHeaders.Add("Idempotency-Key", "same-client-key");
            var response = await client.PostAsJsonAsync(
                path,
                new CreateTestRun.Command { Name = "CI run", Environment = "ci" }
            );
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            return (
                await response.Content.ReadFromJsonAsync<TestRunResponse>(
                    ApiTestHelpers.JsonOptions
                )
            )!;
        }

        async Task<string> IssueTokenAsync(string name)
        {
            var response = await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command { Name = name, Scopes = [ApiTokenScope.RunsWrite] }
            );
            return (
                await response.Content.ReadFromJsonAsync<CreateApiTokenResponse>(
                    ApiTestHelpers.JsonOptions
                )
            )!.Token;
        }

        var firstToken = await IssueTokenAsync("First CI");
        var secondToken = await IssueTokenAsync("Second CI");
        var firstRun = await CreateRunAsTokenAsync(firstToken);
        var secondRun = await CreateRunAsTokenAsync(secondToken);

        secondRun.Id.Should().NotBe(firstRun.Id);
    }

    [Fact]
    public async Task Create_InvalidScopes_ReturnsValidationProblem()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();

        var response = await owner.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command
            {
                Name = "Invalid",
                Scopes = [ApiTokenScope.RunsRead, ApiTokenScope.RunsRead],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }
}
