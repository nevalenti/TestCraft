using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.Errors;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestResults;
using TestCraft.Application.Features.TestSections;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.TestSections;

[Collection(ApiCollection.Name)]
public class SectionCasesApiTests(ApiFactory factory)
{
    private HttpClient CreateClient()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );

        return client;
    }

    private async Task<(HttpClient Client, ProjectId ProjectId, TestSuiteId SuiteId)> SetUpAsync()
    {
        var client = CreateClient();
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);

        return (client, project.Id, suite.Id);
    }

    [Fact]
    public async Task Create_InSection_SetsSectionAndAppendsPosition()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var section = await client.CreateSectionAsync(projectId, suiteId);

        var first = await client.CreateCaseAsync(
            projectId,
            suiteId,
            "First",
            sectionId: section.Id
        );
        var second = await client.CreateCaseAsync(
            projectId,
            suiteId,
            "Second",
            sectionId: section.Id
        );
        var root = await client.CreateCaseAsync(projectId, suiteId, "Root");

        first.SectionId.Should().Be(section.Id);
        (first.Position, second.Position).Should().Be((1, 2));
        (root.SectionId, root.Position).Should().Be((null, 1));
    }

    [Fact]
    public async Task Create_InSectionOfAnotherSuite_ReturnsNotFound()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var otherSuite = await client.CreateSuiteAsync(projectId, "Other");
        var foreign = await client.CreateSectionAsync(projectId, otherSuite.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases",
            new CreateTestCase.Command { Name = "Case", SectionId = foreign.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData(true, true, new[] { "Parent case", "Child case" })]
    [InlineData(true, false, new[] { "Parent case" })]
    [InlineData(false, false, new[] { "Root case" })]
    [InlineData(false, true, new[] { "Root case", "Parent case", "Child case" })]
    public async Task List_FiltersBySection(
        bool filterBySection,
        bool includeDescendants,
        string[] expected
    )
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var parent = await client.CreateSectionAsync(projectId, suiteId, "Parent");
        var child = await client.CreateSectionAsync(projectId, suiteId, "Child", parent.Id);
        await client.CreateCaseAsync(projectId, suiteId, "Root case");
        await client.CreateCaseAsync(projectId, suiteId, "Parent case", sectionId: parent.Id);
        await client.CreateCaseAsync(projectId, suiteId, "Child case", sectionId: child.Id);
        var sectionQuery = filterBySection ? $"&section_id={parent.Id}" : "";

        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases?include_descendants={includeDescendants.ToString().ToLowerInvariant()}{sectionQuery}"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();

        page!.Items.Select(testCase => testCase.Name).Should().Equal(expected);
    }

    [Fact]
    public async Task SortByPosition_ListsTopLevelCasesFirstThenEachSectionInOrder()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var second = await client.CreateSectionAsync(projectId, suiteId, "Second");
        var first = await client.CreateSectionAsync(projectId, suiteId, "First");
        await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/order",
            new ReorderTestSections.Command
            {
                Sections =
                [
                    new() { Id = first.Id, Position = 1 },
                    new() { Id = second.Id, Position = 2 },
                ],
            }
        );
        await client.CreateCaseAsync(projectId, suiteId, "Second A", sectionId: second.Id);
        await client.CreateCaseAsync(projectId, suiteId, "First A", sectionId: first.Id);
        await client.CreateCaseAsync(projectId, suiteId, "Top");
        await client.CreateCaseAsync(projectId, suiteId, "First B", sectionId: first.Id);

        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases?sort_by=position"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();

        page!
            .Items.Select(testCase => testCase.Name)
            .Should()
            .Equal("Top", "First A", "First B", "Second A");
    }

    [Fact]
    public async Task ResultByName_CreatesTheCaseAfterExistingTopLevelCases()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var suite = await (
            await client.GetAsync($"/api/v1/projects/{projectId}/suites/{suiteId}")
        ).Content.ReadFromJsonAsync<TestSuiteResponse>();
        await client.CreateCaseAsync(projectId, suiteId, "Existing");
        var run = await client.CreateRunAsync(projectId);

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/runs/{run.Id}/results/by-name",
            new CreateTestResultByName.Command
            {
                SuiteName = suite!.Name,
                TestCaseName = "From CI",
                Status = TestResultStatus.Passed,
                ExecutedAt = DateTimeOffset.UtcNow,
            }
        );

        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases?sort_by=position"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();
        page!
            .Items.Select(testCase => (testCase.Name, testCase.Position))
            .Should()
            .Equal(("Existing", 1), ("From CI", 2));
    }

    [Fact]
    public async Task Move_AppendsCasesToSectionInListedOrder()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var section = await client.CreateSectionAsync(projectId, suiteId);
        await client.CreateCaseAsync(projectId, suiteId, "Already there", sectionId: section.Id);
        var first = await client.CreateCaseAsync(projectId, suiteId, "First");
        var second = await client.CreateCaseAsync(projectId, suiteId, "Second");

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/move",
            new MoveTestCases.Command { CaseIds = [second.Id, first.Id], SectionId = section.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases?section_id={section.Id}&sort_by=position"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();
        page!
            .Items.Select(testCase => testCase.Name)
            .Should()
            .Equal("Already there", "Second", "First");
    }

    [Fact]
    public async Task Move_CaseOfAnotherSuite_ReturnsCasesNotFound()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var otherSuite = await client.CreateSuiteAsync(projectId, "Other");
        var foreign = await client.CreateCaseAsync(projectId, otherSuite.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/move",
            new MoveTestCases.Command { CaseIds = [foreign.Id] }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("CASES_NOT_FOUND");
    }

    [Fact]
    public async Task Reorder_SetsCasePositions()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var first = await client.CreateCaseAsync(projectId, suiteId, "First");
        var second = await client.CreateCaseAsync(projectId, suiteId, "Second");

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/order",
            new ReorderTestCases.Command
            {
                Cases =
                [
                    new() { Id = first.Id, Position = 2 },
                    new() { Id = second.Id, Position = 1 },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var page = await (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/cases?sort_by=position"
            )
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();
        page!.Items.Select(testCase => testCase.Name).Should().Equal("Second", "First");
    }

    [Fact]
    public async Task Clone_InSameSuite_KeepsSection_AndIntoAnotherSuite_GoesToTopLevel()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var otherSuite = await client.CreateSuiteAsync(projectId, "Other");
        var section = await client.CreateSectionAsync(projectId, suiteId);
        var source = await client.CreateCaseAsync(projectId, suiteId, "Pay", sectionId: section.Id);
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/cases/{source.Id}/clone";

        var sameSuite = await (
            await client.PostAsJsonAsync(url, new CloneTestCase.Command())
        ).Content.ReadFromJsonAsync<TestCaseResponse>();
        var otherSuiteCopy = await (
            await client.PostAsJsonAsync(
                url,
                new CloneTestCase.Command { TargetSuiteId = otherSuite.Id }
            )
        ).Content.ReadFromJsonAsync<TestCaseResponse>();

        (sameSuite!.SectionId, sameSuite.Position).Should().Be((section.Id, 2));
        otherSuiteCopy!.SectionId.Should().BeNull();
    }
}
