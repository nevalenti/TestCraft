using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using FluentAssertions;
using TestCraft.Api.Import;
using TestCraft.Api.Projects;
using TestCraft.Api.TestCases;
using TestCraft.Api.TestCaseSteps;
using TestCraft.Api.TestResults;
using TestCraft.Api.TestRuns;
using TestCraft.Api.Tests.Infrastructure;
using TestCraft.Api.TestSuites;
using TestCraft.Application.Import;
using TestCraft.Application.Projects;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCaseSteps;
using TestCraft.Application.TestResults;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Tests.Workflow;

[Collection(ApiCollection.Name)]
public class TestWorkflowApiTests(ApiFactory factory)
{
    private static readonly JsonSerializerOptions JsonOptions = new(
        JsonSerializerDefaults.Web
    )
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private HttpClient CreateClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", Guid.NewGuid().ToString());

        return client;
    }

    [Fact]
    public async Task FullLifecycle_Project_Suite_Case_Steps_Run_Result()
    {
        var client = CreateClient();

        var project = await (
            await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "Workflow Project" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        var suite = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project!.Id}/suites",
                new CreateTestSuiteRequest { Name = "Login Suite" }
            )
        ).Content.ReadFromJsonAsync<TestSuiteResponse>(JsonOptions);

        var testCase = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/suites/{suite!.Id}/cases",
                new CreateTestCaseRequest
                {
                    Name = "Successful login",
                    Priority = TestCasePriority.High,
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseResponse>(JsonOptions);

        var stepResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/cases/{testCase!.Id}/steps",
            new CreateTestCaseStepRequest
            {
                Order = 1,
                Action = "Open the login page",
                ExpectedResult = "Login form is visible",
            }
        );

        stepResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var step =
            await stepResponse.Content.ReadFromJsonAsync<TestCaseStepResponse>(
                JsonOptions
            );
        step!.TestCaseId.Should().Be(testCase.Id);

        var run = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs",
                new CreateTestRunRequest
                {
                    Name = "Smoke Run",
                    Environment = "staging",
                }
            )
        ).Content.ReadFromJsonAsync<TestRunResponse>(JsonOptions);

        run!.Status.Should().Be(TestRunStatus.Active);

        var resultResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/results",
            new CreateTestResultRequest
            {
                TestCaseId = testCase.Id,
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        resultResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var result =
            await resultResponse.Content.ReadFromJsonAsync<TestResultResponse>(
                JsonOptions
            );
        result!.TestCaseName.Should().Be("Successful login");

        var summaryResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        summaryResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary =
            await summaryResponse.Content.ReadFromJsonAsync<TestRunStatusResponse>(
                JsonOptions
            );
        summary!.Total.Should().Be(1);
        summary.Passed.Should().Be(1);
        summary.PassRate.Should().Be(100);

        var completeResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRunRequest
            {
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        completeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var completed =
            await completeResponse.Content.ReadFromJsonAsync<TestRunResponse>(
                JsonOptions
            );
        completed!.Status.Should().Be(TestRunStatus.Completed);

        var revertResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRunRequest
            {
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Active,
            }
        );

        revertResponse
            .StatusCode.Should()
            .Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task ImportJUnit_CreatesRunWithResults()
    {
        var client = CreateClient();

        var project = await (
            await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "Import Project" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        const string junitXml = """
            <testsuites name="My Suite Run">
              <testsuite name="Auth">
                <testcase name="login works" classname="Auth.Login" />
                <testcase name="logout works" classname="Auth.Logout">
                  <failure message="expected true to be false">stack trace</failure>
                </testcase>
                <testcase name="reset password" classname="Auth.Reset">
                  <skipped />
                </testcase>
              </testsuite>
            </testsuites>
            """;

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project!.Id}/import/junit",
            new ImportJUnitRequest { Xml = junitXml, Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var run = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            JsonOptions
        );
        run!.Name.Should().Be("My Suite Run");
        run.Environment.Should().Be("ci");
        run.Status.Should().Be(TestRunStatus.Completed);

        var summary = await (
            await client.GetAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
            )
        ).Content.ReadFromJsonAsync<TestRunStatusResponse>(JsonOptions);

        summary!.Total.Should().Be(3);
        summary.Passed.Should().Be(1);
        summary.Failed.Should().Be(1);
        summary.Skipped.Should().Be(1);

        var suites = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/suites")
        ).Content.ReadFromJsonAsync<TestCraft.Domain.Pagination.Paginated<TestSuiteResponse>>();

        suites!.Items.Should().ContainSingle(s => s.Name == "Auth");
    }

    [Fact]
    public async Task ImportAllure_CreatesRunWithResults()
    {
        var client = CreateClient();

        var project = await (
            await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "Allure Project" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>(JsonOptions);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project!.Id}/import/allure",
            new ImportAllureRequest
            {
                Environment = "ci",
                Results =
                [
                    new AllureResultItem
                    {
                        Name = "checkout flow works",
                        Status = "passed",
                        Labels =
                        [
                            new AllureLabel
                            {
                                Name = "suite",
                                Value = "Checkout",
                            },
                        ],
                    },
                    new AllureResultItem
                    {
                        Name = "checkout fails on bad card",
                        Status = "broken",
                        StatusDetails = new AllureStatusDetails
                        {
                            Message = "card declined",
                        },
                        Labels =
                        [
                            new AllureLabel
                            {
                                Name = "suite",
                                Value = "Checkout",
                            },
                        ],
                    },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var run = await response.Content.ReadFromJsonAsync<TestRunResponse>(
            JsonOptions
        );
        run!.Name.Should().Be("Allure Import");
        run.Status.Should().Be(TestRunStatus.Completed);

        var summary = await (
            await client.GetAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
            )
        ).Content.ReadFromJsonAsync<TestRunStatusResponse>(JsonOptions);

        summary!.Total.Should().Be(2);
        summary.Passed.Should().Be(1);
        summary.Failed.Should().Be(1);
    }
}
