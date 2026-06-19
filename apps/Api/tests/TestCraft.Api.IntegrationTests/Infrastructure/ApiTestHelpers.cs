using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using TestCraft.Application.Import;
using TestCraft.Application.Projects;
using TestCraft.Application.Projects.Commands.CreateProject;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCases.Commands.CreateTestCase;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestRuns.Commands.CreateTestRun;
using TestCraft.Application.TestSuites;
using TestCraft.Application.TestSuites.Commands.CreateTestSuite;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

internal static class ApiTestHelpers
{
    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    public static async Task<ProjectResponse> CreateProjectAsync(
        this HttpClient client,
        string name = "Project"
    )
    {
        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectCommand { Name = name }
        );

        return (await response.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions))!;
    }

    public static async Task<TestSuiteResponse> CreateSuiteAsync(
        this HttpClient client,
        Guid projectId,
        string name = "Suite"
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites",
            new CreateTestSuiteCommand { Name = name }
        );

        return (await response.Content.ReadFromJsonAsync<TestSuiteResponse>(JsonOptions))!;
    }

    public static async Task<TestCaseResponse> CreateCaseAsync(
        this HttpClient client,
        Guid projectId,
        Guid suiteId,
        string name = "Case",
        TestCasePriority? priority = null
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases",
            new CreateTestCaseCommand { Name = name, Priority = priority }
        );

        return (await response.Content.ReadFromJsonAsync<TestCaseResponse>(JsonOptions))!;
    }

    public static async Task<TestRunResponse> CreateRunAsync(
        this HttpClient client,
        Guid projectId,
        string name = "Run",
        string environment = "staging"
    )
    {
        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs",
            new CreateTestRunCommand { Name = name, Environment = environment }
        );

        return (await response.Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions))!;
    }

    public static async Task<TestRunResponse> GetRunAsync(
        this HttpClient client,
        Guid projectId,
        Guid runId
    )
    {
        var response = await client.GetAsync($"/api/v1/projects/{projectId}/runs/{runId}");

        return (await response.Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions))!;
    }

    public static async Task<ImportJobResponse> WaitForImportJobAsync(
        this HttpClient client,
        Guid projectId,
        Guid jobId,
        TimeSpan? timeout = null
    )
    {
        var deadline = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(5));

        while (true)
        {
            var response = await client.GetAsync($"/api/v1/projects/{projectId}/import/{jobId}");
            var job = (await response.Content.ReadFromJsonAsync<ImportJobResponse>(JsonOptions))!;

            if (job.Status is ImportJobStatus.Completed or ImportJobStatus.Failed)
            {
                return job;
            }

            if (DateTime.UtcNow > deadline)
            {
                throw new TimeoutException($"Import job {jobId} did not complete in time");
            }

            await Task.Delay(50);
        }
    }
}
