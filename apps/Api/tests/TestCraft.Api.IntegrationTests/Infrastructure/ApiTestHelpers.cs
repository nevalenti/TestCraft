using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using TestCraft.Application.Features.Import;
using TestCraft.Application.Features.Labels;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Application.Features.Projects;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestPlans;
using TestCraft.Application.Features.TestResults;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

internal static class ApiTestHelpers
{
    public static readonly ProjectId AnyProjectId = ProjectId.From(Guid.Empty);

    public static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    extension(HttpClient client)
    {
        public async Task<ProjectResponse> CreateProjectAsync(string name = "Project")
        {
            var response = await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProject.Command { Name = name }
            );

            return (await response.Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions))!;
        }

        public async Task<TestSuiteResponse> CreateSuiteAsync(
            ProjectId projectId,
            string name = "Suite"
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites",
                new CreateTestSuite.Command { ProjectId = projectId, Name = name }
            );

            return (await response.Content.ReadFromJsonAsync<TestSuiteResponse>(JsonOptions))!;
        }

        public async Task<TestCaseResponse> CreateCaseAsync(
            ProjectId projectId,
            TestSuiteId suiteId,
            string name = "Case",
            TestCasePriority? priority = null
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases",
                new CreateTestCase.Command
                {
                    ProjectId = projectId,
                    Name = name,
                    Priority = priority,
                }
            );

            return (await response.Content.ReadFromJsonAsync<TestCaseResponse>(JsonOptions))!;
        }

        public async Task<TestRunResponse> CreateRunAsync(
            ProjectId projectId,
            string name = "Run",
            string environment = "staging"
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs",
                new CreateTestRun.Command
                {
                    ProjectId = projectId,
                    Name = name,
                    Environment = environment,
                }
            );

            return (await response.Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions))!;
        }

        public async Task<TestRunResponse> GetRunAsync(ProjectId projectId, TestRunId runId)
        {
            var response = await client.GetAsync($"/api/v1/projects/{projectId}/runs/{runId}");

            return (await response.Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions))!;
        }

        public async Task<LabelResponse> CreateLabelAsync(
            ProjectId projectId,
            string name = "Bug",
            string color = "#FF0000"
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/labels",
                new CreateLabel.Command
                {
                    ProjectId = projectId,
                    Name = name,
                    Color = color,
                }
            );

            return (await response.Content.ReadFromJsonAsync<LabelResponse>(JsonOptions))!;
        }

        public async Task<TestPlanResponse> CreatePlanAsync(
            ProjectId projectId,
            string name = "Plan"
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/plans",
                new CreateTestPlan.Command { ProjectId = projectId, Name = name }
            );

            return (await response.Content.ReadFromJsonAsync<TestPlanResponse>(JsonOptions))!;
        }

        public async Task<TestResultResponse> CreateResultAsync(
            ProjectId projectId,
            TestRunId runId,
            TestCaseId testCaseId,
            TestResultStatus status = TestResultStatus.Passed
        )
        {
            var response = await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/runs/{runId}/results",
                new CreateTestResult.Command
                {
                    ProjectId = projectId,
                    TestCaseId = testCaseId,
                    Status = status,
                    ExecutedAt = DateTimeOffset.UtcNow,
                }
            );

            return (await response.Content.ReadFromJsonAsync<TestResultResponse>(JsonOptions))!;
        }

        public async Task<HttpResponseMessage> AddMemberAsync(ProjectId projectId, string email) =>
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/members",
                new AddProjectMember.Command { ProjectId = projectId, Email = email }
            );

        public async Task<ImportJobResponse> WaitForImportJobAsync(
            ProjectId projectId,
            ImportJobId jobId,
            TimeSpan? timeout = null
        )
        {
            var deadline = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(5));

            while (true)
            {
                var response = await client.GetAsync(
                    $"/api/v1/projects/{projectId}/import/{jobId}"
                );
                var job = (
                    await response.Content.ReadFromJsonAsync<ImportJobResponse>(JsonOptions)
                )!;

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
}
