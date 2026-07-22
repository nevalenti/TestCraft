using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.TestPlans;
using TestCraft.Application.TestRuns;

namespace TestCraft.Api.IntegrationTests.TestPlans;

[Collection(ApiCollection.Name)]
public class TestPlansApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsPlan()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans",
            new CreateTestPlan.Command { Name = "Smoke Plan", Description = "Runs smoke tests" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestPlanResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Name.Should().Be("Smoke Plan");
        created.ProjectId.Should().Be(project.Id);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/plans/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestPlanDetailResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
        fetched.Cases.Should().BeEmpty();
    }

    [Fact]
    public async Task AddCase_Then_GetById_IncludesCaseInPlan()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Login Test");
        var plan = await client.CreatePlanAsync(project.Id);

        var addResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );
        addResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}");
        var detail = await getResponse.Content.ReadFromJsonAsync<TestPlanDetailResponse>(
            ApiTestHelpers.JsonOptions
        );
        detail!.Cases.Should().ContainSingle(planCase => planCase.TestCaseId == testCase.Id);
    }

    [Fact]
    public async Task AddCase_Idempotent_DoesNotDuplicate()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );

        var detail = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}")
        ).Content.ReadFromJsonAsync<TestPlanDetailResponse>(ApiTestHelpers.JsonOptions);

        detail!.Cases.Should().HaveCount(1);
    }

    [Fact]
    public async Task RemoveCase_RemovesCaseFromPlan()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );

        var removeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases/{testCase.Id}"
        );
        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}")
        ).Content.ReadFromJsonAsync<TestPlanDetailResponse>(ApiTestHelpers.JsonOptions);

        detail!.Cases.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateRunFromPlan_CreatesRunWithOneResultPerCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var case1 = await client.CreateCaseAsync(project.Id, suite.Id, "Case 1");
        var case2 = await client.CreateCaseAsync(project.Id, suite.Id, "Case 2");
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = case1.Id }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = case2.Id }
        );

        var runResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/run",
            new CreateRunFromPlan.Command
            {
                TestPlanId = Guid.Empty,
                Name = "Sprint Run",
                Environment = "staging",
            }
        );

        runResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var run = await runResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        run!.Name.Should().Be("Sprint Run");

        var summary = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/summary")
        ).Content.ReadFromJsonAsync<GetTestRunSummary.Response>(ApiTestHelpers.JsonOptions);

        summary!.Total.Should().Be(2);
    }

    [Fact]
    public async Task Update_ChangesName()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var plan = await client.CreatePlanAsync(project.Id, "Original");

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}",
            new UpdateTestPlan.Command { Id = plan.Id, Name = "Renamed" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<TestPlanResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Name.Should().Be("Renamed");
    }

    [Fact]
    public async Task Delete_RemovesPlan()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var plan = await client.CreatePlanAsync(project.Id);

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        var plan = await owner.CreatePlanAsync(project.Id);

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_EmptyName_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans",
            new CreateTestPlan.Command { Name = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetAll_ReturnsPlansForProject()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreatePlanAsync(project.Id, "Plan A");
        await client.CreatePlanAsync(project.Id, "Plan B");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/plans");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var plans = await response.Content.ReadFromJsonAsync<IReadOnlyList<TestPlanResponse>>(
            ApiTestHelpers.JsonOptions
        );
        plans.Should().HaveCountGreaterThanOrEqualTo(2);
        plans.Should().Contain(plan => plan.Name == "Plan A");
        plans.Should().Contain(plan => plan.Name == "Plan B");
    }

    [Fact]
    public async Task ReorderCases_ChangesCaseOrder()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var case1 = await client.CreateCaseAsync(project.Id, suite.Id, "Case 1");
        var case2 = await client.CreateCaseAsync(project.Id, suite.Id, "Case 2");
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = case1.Id }
        );
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = case2.Id }
        );

        var reorderResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases/order",
            new ReorderPlanCases.Command
            {
                TestPlanId = Guid.Empty,
                Cases =
                [
                    new ReorderPlanCases.PlanCaseOrder(case2.Id, 0),
                    new ReorderPlanCases.PlanCaseOrder(case1.Id, 1),
                ],
            }
        );
        reorderResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}")
        ).Content.ReadFromJsonAsync<TestPlanDetailResponse>(ApiTestHelpers.JsonOptions);

        detail!.Cases.Should().HaveCount(2);
        detail.Cases[0].TestCaseId.Should().Be(case2.Id);
        detail.Cases[1].TestCaseId.Should().Be(case1.Id);
    }

    [Fact]
    public async Task ReorderCases_EmptyList_LeavesExistingOrderUnchanged()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Case 1");
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );

        var reorderResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases/order",
            new ReorderPlanCases.Command { TestPlanId = Guid.Empty, Cases = [] }
        );
        reorderResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}")
        ).Content.ReadFromJsonAsync<TestPlanDetailResponse>(ApiTestHelpers.JsonOptions);

        detail!.Cases.Should().ContainSingle(planCase => planCase.TestCaseId == testCase.Id);
    }

    [Fact]
    public async Task ReorderCases_UnknownCaseId_IsIgnored()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Case 1");
        var plan = await client.CreatePlanAsync(project.Id);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases",
            new AddCaseToPlan.Command { TestPlanId = Guid.Empty, TestCaseId = testCase.Id }
        );

        var reorderResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases/order",
            new ReorderPlanCases.Command
            {
                TestPlanId = Guid.Empty,
                Cases = [new ReorderPlanCases.PlanCaseOrder(Guid.NewGuid(), 5)],
            }
        );
        reorderResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{plan.Id}")
        ).Content.ReadFromJsonAsync<TestPlanDetailResponse>(ApiTestHelpers.JsonOptions);

        detail!.Cases.Should().ContainSingle(planCase => planCase.TestCaseId == testCase.Id);
    }

    [Fact]
    public async Task ReorderCases_NonExistentPlan_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{Guid.NewGuid()}/cases/order",
            new ReorderPlanCases.Command { TestPlanId = Guid.Empty, Cases = [] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task ReorderCases_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        var plan = await owner.CreatePlanAsync(project.Id);

        var response = await other.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/cases/order",
            new ReorderPlanCases.Command { TestPlanId = Guid.Empty, Cases = [] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
