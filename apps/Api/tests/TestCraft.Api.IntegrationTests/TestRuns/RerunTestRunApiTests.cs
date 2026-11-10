using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Application.Features.TestResults;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestRuns;

[Collection(ApiCollection.Name)]
public class RerunTestRunApiTests(ApiFactory factory)
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

    private static async Task<(
        ProjectId ProjectId,
        TestRunId RunId,
        TestCaseId Passed,
        TestCaseId Failed,
        TestCaseId Blocked
    )> SeedRunAsync(HttpClient client)
    {
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var passed = await client.CreateCaseAsync(project.Id, suite.Id, "Passes");
        var failed = await client.CreateCaseAsync(project.Id, suite.Id, "Fails");
        var blocked = await client.CreateCaseAsync(project.Id, suite.Id, "Blocked");
        var run = await client.CreateRunAsync(project.Id, "Nightly", "staging");
        await client.CreateResultAsync(project.Id, run.Id, passed.Id, TestResultStatus.Passed);
        await client.CreateResultAsync(project.Id, run.Id, failed.Id, TestResultStatus.Failed);
        await client.CreateResultAsync(project.Id, run.Id, blocked.Id, TestResultStatus.Blocked);

        return (project.Id, run.Id, passed.Id, failed.Id, blocked.Id);
    }

    private static async Task<IReadOnlyList<TestResultResponse>> GetResultsAsync(
        HttpClient client,
        ProjectId projectId,
        TestRunId runId
    )
    {
        var page = await client.GetFromJsonAsync<Paginated<TestResultResponse>>(
            $"/api/v1/projects/{projectId}/runs/{runId}/results?page_size=100",
            ApiTestHelpers.JsonOptions
        );

        return page!.Items;
    }

    [Fact]
    public async Task Rerun_All_CreatesAnActiveRunWithAnUntestedResultPerCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, passed, failed, blocked) = await SeedRunAsync(client);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
            new RerunTestRun.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var rerun = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        rerun!.Id.Should().NotBe(runId);
        rerun.Name.Should().Be("Rerun of Nightly");
        rerun.Environment.Should().Be("staging");
        rerun.Status.Should().Be(TestRunStatus.Active);
        var results = await GetResultsAsync(client, projectId, rerun.Id);
        results
            .Select(result => result.TestCaseId)
            .Should()
            .BeEquivalentTo([passed, failed, blocked]);
        results.Should().OnlyContain(result => result.Status == TestResultStatus.Untested);
    }

    [Fact]
    public async Task Rerun_FailedOnly_IncludesFailedAndBlockedCases()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _, failed, blocked) = await SeedRunAsync(client);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
            new RerunTestRun.Command { FailedOnly = true }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var rerun = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        var results = await GetResultsAsync(client, projectId, rerun!.Id);
        results.Select(result => result.TestCaseId).Should().BeEquivalentTo([failed, blocked]);
    }

    [Fact]
    public async Task Rerun_FailedOnly_SkipsCasesThatPassedOnALaterAttempt()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _, failed, blocked) = await SeedRunAsync(client);
        await client.CreateResultAsync(projectId, runId, failed, TestResultStatus.Passed);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
            new RerunTestRun.Command { FailedOnly = true }
        );

        var rerun = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        var results = await GetResultsAsync(client, projectId, rerun!.Id);
        results.Select(result => result.TestCaseId).Should().BeEquivalentTo([blocked]);
    }

    [Fact]
    public async Task Rerun_FailedOnly_WithNothingFailed_ReturnsConflict()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(project.Id, run.Id, testCase.Id, TestResultStatus.Passed);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/rerun",
            new RerunTestRun.Command { FailedOnly = true }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("NOTHING_TO_RERUN");
    }

    [Fact]
    public async Task Rerun_WithNameAndEnvironment_UsesThem()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _, _, _) = await SeedRunAsync(client);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
            new RerunTestRun.Command { Name = "Retest after fix", Environment = "production" }
        );

        var rerun = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        rerun!.Name.Should().Be("Retest after fix");
        rerun.Environment.Should().Be("production");
    }

    [Fact]
    public async Task Rerun_LeavesTheOriginalRunUntouched()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _, _, _) = await SeedRunAsync(client);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
            new RerunTestRun.Command()
        );

        var results = await GetResultsAsync(client, projectId, runId);
        results.Should().HaveCount(3);
        results.Should().NotContain(result => result.Status == TestResultStatus.Untested);
    }

    [Fact]
    public async Task Rerun_OfARunInAnotherProject_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var (_, runId, _, _, _) = await SeedRunAsync(client);
        var otherProject = await client.CreateProjectAsync("Other");

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{otherProject.Id}/runs/{runId}/rerun",
            new RerunTestRun.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Rerun_AsViewer_ReturnsForbidden()
    {
        var owner = CreateClient(Guid.NewGuid());
        var (projectId, runId, _, _, _) = await SeedRunAsync(owner);
        var viewerId = Guid.NewGuid();
        var email = $"{viewerId}@example.com";
        factory.RegisterUser(email, viewerId);
        await owner.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/members",
            new AddProjectMember.Command { Email = email, Role = AssignableRole.Viewer }
        );

        var response = await CreateClient(viewerId)
            .PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs/{runId}/rerun",
                new RerunTestRun.Command()
            );

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
