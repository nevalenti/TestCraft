using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestResults;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestResults;

[Collection(ApiCollection.Name)]
public class TestResultsApiTests(ApiFactory factory)
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
        Guid ProjectId,
        Guid RunId,
        Guid TestCaseId
    )> CreateProjectRunCaseAsync(HttpClient client)
    {
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);

        return (project.Id, run.Id, testCase.Id);
    }

    [Fact]
    public async Task Create_Then_GetById_ReturnsResult()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCaseId,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestResultResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.TestRunId.Should().Be(runId);
        created.TestCaseId.Should().Be(testCaseId);
        created.Status.Should().Be(TestResultStatus.Passed);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestResultResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task GetAll_FiltersByStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCaseId,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCaseId,
                Status = TestResultStatus.Failed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        var response = await client.GetAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results?status=Failed"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestResultResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().OnlyContain(r => r.Status == TestResultStatus.Failed);
    }

    [Fact]
    public async Task Update_ChangesStatusAndNotes()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs/{runId}/results",
                new CreateTestResult.Command
                {
                    TestCaseId = testCaseId,
                    Status = TestResultStatus.Passed,
                    ExecutedAt = DateTimeOffset.UtcNow,
                }
            )
        ).Content.ReadFromJsonAsync<TestResultResponse>(ApiTestHelpers.JsonOptions);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{created!.Id}",
            new UpdateTestResult.Command
            {
                Id = created!.Id,
                Status = TestResultStatus.Failed,
                Notes = "Investigated, found a regression",
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestResultResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Status.Should().Be(TestResultStatus.Failed);
        updated.Notes.Should().Be("Investigated, found a regression");
    }

    [Fact]
    public async Task Delete_RemovesResult()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs/{runId}/results",
                new CreateTestResult.Command
                {
                    TestCaseId = testCaseId,
                    Status = TestResultStatus.Passed,
                    ExecutedAt = DateTimeOffset.UtcNow,
                }
            )
        ).Content.ReadFromJsonAsync<TestResultResponse>(ApiTestHelpers.JsonOptions);

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{created!.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_OnArchivedRun_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        var run = await (
            await client.GetAsync($"/api/v1/projects/{projectId}/runs/{runId}")
        ).Content.ReadFromJsonAsync<TestRunResponse>(ApiTestHelpers.JsonOptions);

        await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = run!.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );
        await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Archived,
            }
        );

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results",
            new CreateTestResult.Command
            {
                TestCaseId = testCaseId,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_OnArchivedRun_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, testCaseId) = await CreateProjectRunCaseAsync(client);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs/{runId}/results",
                new CreateTestResult.Command
                {
                    TestCaseId = testCaseId,
                    Status = TestResultStatus.Passed,
                    ExecutedAt = DateTimeOffset.UtcNow,
                }
            )
        ).Content.ReadFromJsonAsync<TestResultResponse>(ApiTestHelpers.JsonOptions);

        var run = await (
            await client.GetAsync($"/api/v1/projects/{projectId}/runs/{runId}")
        ).Content.ReadFromJsonAsync<TestRunResponse>(ApiTestHelpers.JsonOptions);

        await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = run!.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );
        await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}",
            new UpdateTestRun.Command
            {
                Id = runId,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Archived,
            }
        );

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{created!.Id}",
            new UpdateTestResult.Command { Id = created.Id, Status = TestResultStatus.Failed }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetById_NonExistentResult_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _) = await CreateProjectRunCaseAsync(client);

        var response = await client.GetAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results/{Guid.NewGuid()}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, _) = await CreateProjectRunCaseAsync(client);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{runId}/results",
            new CreateTestResult.Command
            {
                TestCaseId = Guid.Empty,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/runs/{Guid.NewGuid()}/results",
            new CreateTestResult.Command
            {
                TestCaseId = Guid.NewGuid(),
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
