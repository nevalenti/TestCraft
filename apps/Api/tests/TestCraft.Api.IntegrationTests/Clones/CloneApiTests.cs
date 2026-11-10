using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.ApiTokens;
using TestCraft.Application.Features.Labels;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestCaseSteps;
using TestCraft.Application.Features.TestPlans;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Clones;

[Collection(ApiCollection.Name)]
public class CloneApiTests(ApiFactory factory)
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

    private static async Task<T> ReadAsync<T>(HttpResponseMessage response) =>
        (await response.Content.ReadFromJsonAsync<T>(ApiTestHelpers.JsonOptions))!;

    private static async Task AddStepAsync(
        HttpClient client,
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        int order,
        string action
    ) => (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps",
                new CreateTestCaseStep.Command
                {
                    Order = order,
                    Action = action,
                    ExpectedResult = "Works",
                }
            )
        ).StatusCode.Should().Be(HttpStatusCode.Created);

    private static async Task<IReadOnlyList<TestCaseStepResponse>> StepsOfAsync(
        HttpClient client,
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId
    ) =>
        (
            await ReadAsync<Paginated<TestCaseStepResponse>>(
                await client.GetAsync(
                    $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{caseId}/steps"
                )
            )
        ).Items;

    private static async Task<IReadOnlyList<TestCaseResponse>> CasesOfAsync(
        HttpClient client,
        ProjectId projectId,
        TestSuiteId suiteId
    ) =>
        (
            await ReadAsync<Paginated<TestCaseResponse>>(
                await client.GetAsync($"/api/v1/projects/{projectId}/suites/{suiteId}/cases")
            )
        ).Items;

    private static async Task<HttpResponseMessage> CloneCaseAsync(
        HttpClient client,
        ProjectId projectId,
        TestCaseResponse source,
        CloneTestCase.Command body
    ) =>
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{source.SuiteId}/cases/{source.Id}/clone",
            body
        );

    [Fact]
    public async Task CloneCase_InSameSuite_CopiesStepsAndLabelsUnderACopyName()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var source = await client.CreateCaseAsync(
            project.Id,
            suite.Id,
            "Login",
            TestCasePriority.High
        );
        await AddStepAsync(client, project.Id, suite.Id, source.Id, 1, "Open the page");
        await AddStepAsync(client, project.Id, suite.Id, source.Id, 2, "Submit the form");
        var label = await client.CreateLabelAsync(project.Id, "Smoke", "#00FF00");
        await client.PostAsync(
            $"/api/v1/projects/{project.Id}/cases/{source.Id}/labels/{label.Id}",
            null
        );

        var response = await CloneCaseAsync(client, project.Id, source, new());

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var copy = await ReadAsync<TestCaseResponse>(response);
        copy.Id.Should().NotBe(source.Id);
        copy.Name.Should().Be("Login (copy)");
        copy.SuiteId.Should().Be(suite.Id);
        copy.Priority.Should().Be(TestCasePriority.High);
        copy.Labels.Should().ContainSingle(copied => copied.Id == label.Id);
        (await StepsOfAsync(client, project.Id, suite.Id, copy.Id))
            .Select(step => step.Action)
            .Should()
            .Equal("Open the page", "Submit the form");
        var second = await ReadAsync<TestCaseResponse>(
            await CloneCaseAsync(client, project.Id, source, new())
        );
        second.Name.Should().Be("Login (copy 2)");
    }

    [Fact]
    public async Task CloneCase_IntoAnotherSuite_KeepsTheName()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var from = await client.CreateSuiteAsync(project.Id, "From");
        var to = await client.CreateSuiteAsync(project.Id, "To");
        var source = await client.CreateCaseAsync(project.Id, from.Id, "Login");

        var response = await CloneCaseAsync(
            client,
            project.Id,
            source,
            new CloneTestCase.Command { TargetSuiteId = to.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var copy = await ReadAsync<TestCaseResponse>(response);
        copy.SuiteId.Should().Be(to.Id);
        copy.Name.Should().Be("Login");
        (await CasesOfAsync(client, project.Id, from.Id)).Should().ContainSingle();
    }

    [Fact]
    public async Task CloneCase_IntoASuiteOfAnotherProject_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var other = await client.CreateProjectAsync("Other");
        var suite = await client.CreateSuiteAsync(project.Id);
        var otherSuite = await client.CreateSuiteAsync(other.Id);
        var source = await client.CreateCaseAsync(project.Id, suite.Id);

        var response = await CloneCaseAsync(
            client,
            project.Id,
            source,
            new CloneTestCase.Command { TargetSuiteId = otherSuite.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CloneCase_WithATakenName_ReturnsConflict()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var source = await client.CreateCaseAsync(project.Id, suite.Id, "Login");

        var response = await CloneCaseAsync(
            client,
            project.Id,
            source,
            new CloneTestCase.Command { Name = "Login" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task CloneSuite_InSameProject_CopiesItsCases()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id, "Checkout");
        var source = await client.CreateCaseAsync(project.Id, suite.Id, "Pay");
        await AddStepAsync(client, project.Id, suite.Id, source.Id, 1, "Enter the card");
        var label = await client.CreateLabelAsync(project.Id, "Smoke", "#00FF00");
        await client.PostAsync(
            $"/api/v1/projects/{project.Id}/cases/{source.Id}/labels/{label.Id}",
            null
        );

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/clone",
            new CloneTestSuite.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var copy = await ReadAsync<TestSuiteResponse>(response);
        copy.Name.Should().Be("Checkout (copy)");
        copy.ProjectId.Should().Be(project.Id);
        var cases = await CasesOfAsync(client, project.Id, copy.Id);
        var copiedCase = cases.Should().ContainSingle().Subject;
        copiedCase.Name.Should().Be("Pay");
        copiedCase.Labels.Should().ContainSingle(copied => copied.Id == label.Id);
        (await StepsOfAsync(client, project.Id, copy.Id, copiedCase.Id))
            .Should()
            .ContainSingle(step => step.Action == "Enter the card");
    }

    [Fact]
    public async Task CloneSuite_IntoAnotherProject_MatchesOrCreatesLabelsByName()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var target = await client.CreateProjectAsync("Target");
        var suite = await client.CreateSuiteAsync(project.Id, "Checkout");
        var source = await client.CreateCaseAsync(project.Id, suite.Id, "Pay");
        var smoke = await client.CreateLabelAsync(project.Id, "Smoke", "#00FF00");
        var bug = await client.CreateLabelAsync(project.Id, "Bug", "#FF0000");
        var existing = await client.CreateLabelAsync(target.Id, "Smoke", "#0000FF");
        foreach (var label in new[] { smoke, bug })
        {
            await client.PostAsync(
                $"/api/v1/projects/{project.Id}/cases/{source.Id}/labels/{label.Id}",
                null
            );
        }

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/clone",
            new CloneTestSuite.Command { TargetProjectId = target.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var copy = await ReadAsync<TestSuiteResponse>(response);
        copy.ProjectId.Should().Be(target.Id);
        copy.Name.Should().Be("Checkout");
        var copiedCase = (await CasesOfAsync(client, target.Id, copy.Id)).Single();
        copiedCase.Labels.Select(label => label.Name).Should().Equal("Bug", "Smoke");
        copiedCase.Labels.Should().OnlyContain(label => label.ProjectId == target.Id);
        copiedCase.Labels.Should().Contain(label => label.Id == existing.Id);
        (await CasesOfAsync(client, project.Id, suite.Id)).Should().ContainSingle();
    }

    [Fact]
    public async Task CloneSuite_IntoAProjectWhereTheCallerIsAViewer_ReturnsForbidden()
    {
        var owner = CreateClient(Guid.NewGuid());
        var target = await owner.CreateProjectAsync("Target");
        var callerId = Guid.NewGuid();
        var email = $"{callerId}@example.com";
        factory.RegisterUser(email, callerId);
        await owner.PostAsJsonAsync(
            $"/api/v1/projects/{target.Id}/members",
            new AddProjectMember.Command { Email = email, Role = AssignableRole.Viewer }
        );
        var caller = CreateClient(callerId);
        var project = await caller.CreateProjectAsync();
        var suite = await caller.CreateSuiteAsync(project.Id);

        var response = await caller.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/clone",
            new CloneTestSuite.Command { TargetProjectId = target.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CloneSuite_IntoAProjectTheCallerCannotSee_ReturnsNotFound()
    {
        var stranger = CreateClient(Guid.NewGuid());
        var hidden = await CreateClient(Guid.NewGuid()).CreateProjectAsync("Hidden");
        var project = await stranger.CreateProjectAsync();
        var suite = await stranger.CreateSuiteAsync(project.Id);

        var response = await stranger.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/clone",
            new CloneTestSuite.Command { TargetProjectId = hidden.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CloneSuite_IntoAnotherProjectWithAnApiToken_ReturnsForbidden()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var target = await owner.CreateProjectAsync("Target");
        var suite = await owner.CreateSuiteAsync(project.Id);
        var created = await ReadAsync<CreateApiTokenResponse>(
            await owner.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command { Name = "CI", Scopes = [ApiTokenScope.SuitesWrite] }
            )
        );
        var tokenClient = factory.CreateClient();
        tokenClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            created.Token
        );

        var response = await tokenClient.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}/clone",
            new CloneTestSuite.Command { TargetProjectId = target.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task ClonePlan_CopiesItsCasesInOrder()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var first = await client.CreateCaseAsync(project.Id, suite.Id, "First");
        var second = await client.CreateCaseAsync(project.Id, suite.Id, "Second");
        var plan = await client.CreatePlanAsync(project.Id, "Release");
        await client.AddCaseToPlanAsync(project.Id, plan.Id, second.Id);
        await client.AddCaseToPlanAsync(project.Id, plan.Id, first.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/plans/{plan.Id}/clone",
            new CloneTestPlan.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var copy = await ReadAsync<TestPlanResponse>(response);
        copy.Id.Should().NotBe(plan.Id);
        copy.Name.Should().Be("Release (copy)");
        var cases = await ReadAsync<IReadOnlyList<TestPlanCaseResponse>>(
            await client.GetAsync($"/api/v1/projects/{project.Id}/plans/{copy.Id}/cases")
        );
        cases.Select(planCase => planCase.TestCaseId).Should().Equal(second.Id, first.Id);
    }

    [Fact]
    public async Task ClonePlan_OfAnotherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var plan = await owner.CreatePlanAsync(project.Id);

        var response = await CreateClient(Guid.NewGuid())
            .PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/plans/{plan.Id}/clone",
                new CloneTestPlan.Command()
            );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
