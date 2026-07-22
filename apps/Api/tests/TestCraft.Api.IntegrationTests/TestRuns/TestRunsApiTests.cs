using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.IntegrationTests.TestRuns;

[Collection(ApiCollection.Name)]
public class TestRunsApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsRunWithDefaultActiveStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRun.Command { Name = "Smoke Run", Environment = "staging" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Status.Should().Be(TestRunStatus.Active);
        created.ProjectId.Should().Be(project.Id);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreateRunAsync(project.Id, "Smoke Run");
        await client.CreateRunAsync(project.Id, "Regression Run");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/runs?search=Smoke");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestRunResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().ContainSingle(run => run.Name == "Smoke Run");
        page.Items.Should().NotContain(run => run.Name == "Regression Run");
    }

    [Fact]
    public async Task Update_ValidStatusTransition_Succeeds()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task Update_StatusTransition_PreservesCreatedAtButAdvancesUpdatedAt()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        run.CreatedAt.Should().Be(run.UpdatedAt);

        await Task.Delay(TimeSpan.FromMilliseconds(50));

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );

        updated!.CreatedAt.Should().BeCloseTo(run.CreatedAt, TimeSpan.FromMilliseconds(1));
        updated.UpdatedAt.Should().BeAfter(run.UpdatedAt);
    }

    [Fact]
    public async Task Update_BackwardStatusTransition_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRun.Command
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Active,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var runId = Guid.NewGuid();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = "Doesn't matter",
                Environment = "ci",
                Status = TestRunStatus.Active,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Delete_RemovesRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, "To Delete");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetSummary_NoResults_ReturnsZeroedTotals()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<GetTestRunSummary.Response>(
            ApiTestHelpers.JsonOptions
        );
        summary!.Total.Should().Be(0);
        summary.Passed.Should().Be(0);
        summary.Failed.Should().Be(0);
        summary.Blocked.Should().Be(0);
        summary.Skipped.Should().Be(0);
        summary.PassRate.Should().Be(0);
    }

    [Fact]
    public async Task GetSummary_WithMixedResults_ComputesCountsAndPassRate()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var case1 = await client.CreateCaseAsync(project.Id, suite.Id, "Passes");
        var case2 = await client.CreateCaseAsync(project.Id, suite.Id, "Fails");
        var case3 = await client.CreateCaseAsync(project.Id, suite.Id, "Blocked");
        var run = await client.CreateRunAsync(project.Id);

        await client.CreateResultAsync(project.Id, run.Id, case1.Id, TestResultStatus.Passed);
        await client.CreateResultAsync(project.Id, run.Id, case2.Id, TestResultStatus.Failed);
        await client.CreateResultAsync(project.Id, run.Id, case3.Id, TestResultStatus.Blocked);

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<GetTestRunSummary.Response>(
            ApiTestHelpers.JsonOptions
        );
        summary!.Total.Should().Be(3);
        summary.Passed.Should().Be(1);
        summary.Failed.Should().Be(1);
        summary.Blocked.Should().Be(1);
        summary.PassRate.Should().Be(33);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var run = await ownerClient.CreateRunAsync(project.Id, "Private Run");

        var response = await otherClient.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/runs",
            new CreateTestRun.Command { Name = "Nope", Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRun.Command { Name = "", Environment = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_ConcurrentLoads_LostUpdateIsNotDetected()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        using var scopeA = factory.Services.CreateScope();
        using var scopeB = factory.Services.CreateScope();
        var contextA = scopeA.ServiceProvider.GetRequiredService<AppDbContext>();
        var contextB = scopeB.ServiceProvider.GetRequiredService<AppDbContext>();

        var runA = await contextA.TestRuns.SingleAsync(testRun => testRun.Id == run.Id);
        var runB = await contextB.TestRuns.SingleAsync(testRun => testRun.Id == run.Id);

        runB.TransitionTo(TestRunStatus.Archived);
        await contextB.SaveChangesAsync();

        var act = () =>
        {
            runA.TransitionTo(TestRunStatus.Completed);
            return contextA.SaveChangesAsync();
        };

        await act.Should().NotThrowAsync();

        var final = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}")
        ).Content.ReadFromJsonAsync<TestRunResponse>(ApiTestHelpers.JsonOptions);

        final!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task AppendLogs_Then_GetLogs_ReturnsLogsInOrder()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var appendResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["first line"] }
        );
        appendResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["second line"] }
        );

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["third line"] }
        );

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var logs = await getResponse.Content.ReadFromJsonAsync<List<string>>(
            ApiTestHelpers.JsonOptions
        );
        logs.Should().Equal("first line", "second line", "third line");
    }

    [Fact]
    public async Task AppendLogs_EmptyLines_IsNoOp()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var appendResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = [] }
        );
        appendResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs"
        );
        var logs = await getResponse.Content.ReadFromJsonAsync<List<string>>(
            ApiTestHelpers.JsonOptions
        );
        logs.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLogs_NewRun_ReturnsEmptyList()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/logs");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var logs = await response.Content.ReadFromJsonAsync<List<string>>(
            ApiTestHelpers.JsonOptions
        );
        logs.Should().BeEmpty();
    }

    [Fact]
    public async Task GetLogs_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{Guid.NewGuid()}/logs"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task AppendLogs_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{Guid.NewGuid()}/logs",
            new AppendRunLogs.Command { Lines = ["line"] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task AppendLogs_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var run = await ownerClient.CreateRunAsync(project.Id);

        var response = await otherClient.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["snooping"] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
