using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using FluentAssertions;

using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCaseSteps;

namespace TestCraft.Api.IntegrationTests.TestCaseSteps;

[Collection(ApiCollection.Name)]
public class TestCaseStepsApiTests(ApiFactory factory)
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
        TestSuiteId SuiteId,
        TestCaseId CaseId
    )> CreateProjectSuiteCaseAsync(HttpClient client)
    {
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);

        return (project.Id, suite.Id, testCase.Id);
    }

    [Fact]
    public async Task Create_Then_GetById_ReturnsStep()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
            new CreateTestCaseStep.Command
            {
                Order = 1,
                Action = "Open the login page",
                ExpectedResult = "Login form is visible",
            }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestCaseStepResponse>();
        created!.TestCaseId.Should().Be(caseId);
        created.Order.Should().Be(1);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestCaseStepResponse>();
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task GetAll_ReturnsStepsForCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
            new CreateTestCaseStep.Command
            {
                Order = 1,
                Action = "Open the login page",
                ExpectedResult = "Login form is visible",
            }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
            new CreateTestCaseStep.Command
            {
                Order = 2,
                Action = "Enter credentials",
                ExpectedResult = "Fields accept input",
            }
        );

        var response = await client.GetAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestCaseStepResponse>>();
        page!.Items.Should().HaveCount(2);
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = 1,
                    Action = "Open the login page",
                    ExpectedResult = "Login form is visible",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{created!.Id}",
            new UpdateTestCaseStep.Command
            {
                Id = created!.Id,
                Order = 1,
                Action = "Open the updated login page",
                ExpectedResult = "Updated login form is visible",
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestCaseStepResponse>();
        updated!.Action.Should().Be("Open the updated login page");
        updated.ExpectedResult.Should().Be("Updated login form is visible");
    }

    [Fact]
    public async Task Delete_RemovesStep()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = 1,
                    Action = "Open the login page",
                    ExpectedResult = "Login form is visible",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{created!.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task BulkReorder_ReordersSteps()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var first = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = 1,
                    Action = "First action",
                    ExpectedResult = "First result",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        var second = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = 2,
                    Action = "Second action",
                    ExpectedResult = "Second result",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        var reorderResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/reorder",
            new BulkReorderSteps.Command
            {
                Steps =
                [
                    new BulkReorderSteps.StepOrder { Id = first!.Id, Order = 2 },
                    new BulkReorderSteps.StepOrder { Id = second!.Id, Order = 1 },
                ],
            }
        );

        reorderResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var firstAfter = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{first.Id}"
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();
        var secondAfter = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{second.Id}"
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        firstAfter!.Order.Should().Be(2);
        secondAfter!.Order.Should().Be(1);
    }

    [Fact]
    public async Task BulkReorder_WithDuplicateIds_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var step = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = 1,
                    Action = "Action",
                    ExpectedResult = "Result",
                }
            )
        ).Content.ReadFromJsonAsync<TestCaseStepResponse>();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/reorder",
            new BulkReorderSteps.Command
            {
                Steps =
                [
                    new BulkReorderSteps.StepOrder { Id = step!.Id, Order = 1 },
                    new BulkReorderSteps.StepOrder { Id = step.Id, Order = 2 },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task BulkReorder_WithUnknownStepId_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/reorder",
            new BulkReorderSteps.Command
            {
                Steps = [new BulkReorderSteps.StepOrder { Id = TestCaseStepId.New(), Order = 1 }],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_NonExistentStep_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);
        var stepId = TestCaseStepId.New();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps/{stepId}",
            new UpdateTestCaseStep.Command
            {
                Id = stepId,
                Order = 1,
                Action = "Action",
                ExpectedResult = "Result",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, suiteId, caseId) = await CreateProjectSuiteCaseAsync(client);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
            new CreateTestCaseStep.Command
            {
                Order = 0,
                Action = "",
                ExpectedResult = "",
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
            $"/api/v1/projects/{Guid.NewGuid()}/suites/{Guid.NewGuid()}/cases/{Guid.NewGuid()}/steps",
            new CreateTestCaseStep.Command
            {
                Order = 1,
                Action = "Action",
                ExpectedResult = "Result",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
