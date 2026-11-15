using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.Errors;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;
using TestCraft.Application.Features.TestSections;
using TestCraft.Domain.Common;

namespace TestCraft.Api.IntegrationTests.TestSections;

[Collection(ApiCollection.Name)]
public class TestSectionsApiTests(ApiFactory factory)
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
    public async Task List_ReturnsFlatTreeWithParentsAndPositions()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var checkout = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        var cards = await client.CreateSectionAsync(projectId, suiteId, "Cards", checkout.Id);
        await client.CreateSectionAsync(projectId, suiteId, "Coupons", checkout.Id);
        await client.CreateCaseAsync(projectId, suiteId, "Pay", sectionId: cards.Id);

        var sections = await (
            await client.GetAsync($"/api/v1/projects/{projectId}/suites/{suiteId}/sections")
        ).Content.ReadFromJsonAsync<List<TestSectionResponse>>();

        sections!
            .Select(section =>
                (section.Name, section.ParentId, section.Position, section.CaseCount)
            )
            .Should()
            .BeEquivalentTo([
                ("Checkout", (TestSectionId?)null, 1, 0),
                ("Cards", (TestSectionId?)checkout.Id, 1, 1),
                ("Coupons", (TestSectionId?)checkout.Id, 2, 0),
            ]);
    }

    [Fact]
    public async Task Create_WithSiblingName_ReturnsConflict_AtTopLevelAndUnderAParent()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var checkout = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        await client.CreateSectionAsync(projectId, suiteId, "Cards", checkout.Id);
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/sections";

        var topLevel = await client.PostAsJsonAsync(
            url,
            new CreateTestSection.Command { Name = "Checkout" }
        );
        var nested = await client.PostAsJsonAsync(
            url,
            new CreateTestSection.Command { Name = "Cards", ParentId = checkout.Id }
        );
        var otherParent = await client.PostAsJsonAsync(
            url,
            new CreateTestSection.Command { Name = "Cards" }
        );

        topLevel.StatusCode.Should().Be(HttpStatusCode.Conflict);
        nested.StatusCode.Should().Be(HttpStatusCode.Conflict);
        otherParent.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_UnderParentOfAnotherSuite_ReturnsNotFound()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var otherSuite = await client.CreateSuiteAsync(projectId, "Other");
        var foreign = await client.CreateSectionAsync(projectId, otherSuite.Id, "Foreign");

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections",
            new CreateTestSection.Command { Name = "Child", ParentId = foreign.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Update_RenamesSection_AndRejectsStaleVersion()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var section = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{section.Id}";

        var renamed = await client.UpdateAsJsonAsync(
            url,
            new UpdateTestSection.Command { Name = "Payment" }
        );
        var stale = await client.UpdateAsJsonAsync(
            url,
            new UpdateTestSection.Command { Name = "Billing" }
        );

        renamed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await renamed.Content.ReadFromJsonAsync<TestSectionResponse>())!
            .Name.Should()
            .Be("Payment");
        stale.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    [Fact]
    public async Task Move_ChangesParentAndPutsSectionLast()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var checkout = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        await client.CreateSectionAsync(projectId, suiteId, "Cards", checkout.Id);
        var coupons = await client.CreateSectionAsync(projectId, suiteId, "Coupons");

        var response = await client.SendVersionedAsJsonAsync(
            HttpMethod.Post,
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{coupons.Id}/move",
            new MoveTestSection.Command { ParentId = checkout.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var moved = await response.Content.ReadFromJsonAsync<TestSectionResponse>();
        moved!.ParentId.Should().Be(checkout.Id);
        moved.Position.Should().Be(2);
    }

    [Fact]
    public async Task Move_IntoOwnSubsection_ReturnsSectionCycle()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var checkout = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        var cards = await client.CreateSectionAsync(projectId, suiteId, "Cards", checkout.Id);

        var response = await client.SendVersionedAsJsonAsync(
            HttpMethod.Post,
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{checkout.Id}/move",
            new MoveTestSection.Command { ParentId = cards.Id }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        (await response.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("SECTION_CYCLE");
    }

    [Fact]
    public async Task Move_BeyondMaxDepth_ReturnsSectionTooDeep()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        TestSectionId? parentId = null;
        for (var level = 1; level <= SectionTree.MaxDepth; level++)
        {
            parentId = (
                await client.CreateSectionAsync(projectId, suiteId, $"Level {level}", parentId)
            ).Id;
        }

        var deeper = await client.PostAsJsonAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections",
            new CreateTestSection.Command { Name = "Too deep", ParentId = parentId }
        );
        var branch = await client.CreateSectionAsync(projectId, suiteId, "Branch");
        await client.CreateSectionAsync(projectId, suiteId, "Leaf", branch.Id);
        var moved = await client.SendVersionedAsJsonAsync(
            HttpMethod.Post,
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{branch.Id}/move",
            new MoveTestSection.Command { ParentId = parentId }
        );

        (await deeper.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("SECTION_TOO_DEEP");
        moved.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        (await moved.Content.ReadFromJsonAsync<ProblemResponse>())!
            .Code.Should()
            .Be("SECTION_TOO_DEEP");
    }

    [Fact]
    public async Task ConcurrentOppositeMoves_LeaveNoCycle()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var first = await client.CreateSectionAsync(projectId, suiteId, "First");
        var second = await client.CreateSectionAsync(projectId, suiteId, "Second");
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/sections";

        var responses = await Task.WhenAll(
            client.SendVersionedAsJsonAsync(
                HttpMethod.Post,
                $"{url}/{first.Id}/move",
                new MoveTestSection.Command { ParentId = second.Id }
            ),
            client.SendVersionedAsJsonAsync(
                HttpMethod.Post,
                $"{url}/{second.Id}/move",
                new MoveTestSection.Command { ParentId = first.Id }
            )
        );

        responses
            .Select(response => response.StatusCode)
            .Should()
            .BeEquivalentTo([HttpStatusCode.OK, HttpStatusCode.UnprocessableEntity]);
    }

    [Fact]
    public async Task CreateChildWhileParentIsDeleted_LeavesNoOrphan()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var parent = await client.CreateSectionAsync(projectId, suiteId, "Parent");
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/sections";

        await Task.WhenAll(
            client.DeleteAsync($"{url}/{parent.Id}"),
            client.PostAsJsonAsync(
                url,
                new CreateTestSection.Command { Name = "Child", ParentId = parent.Id }
            )
        );

        var sections = await (await client.GetAsync(url)).Content.ReadFromJsonAsync<
            List<TestSectionResponse>
        >();
        sections.Should().BeEmpty();
    }

    [Fact]
    public async Task Reorder_SetsPositions()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var first = await client.CreateSectionAsync(projectId, suiteId, "First");
        var second = await client.CreateSectionAsync(projectId, suiteId, "Second");
        var url = $"/api/v1/projects/{projectId}/suites/{suiteId}/sections";

        var response = await client.PutAsJsonAsync(
            $"{url}/order",
            new ReorderTestSections.Command
            {
                Sections =
                [
                    new() { Id = first.Id, Position = 2 },
                    new() { Id = second.Id, Position = 1 },
                ],
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        var sections = await (await client.GetAsync(url)).Content.ReadFromJsonAsync<
            List<TestSectionResponse>
        >();
        sections!.Select(section => section.Name).Should().Equal("Second", "First");
    }

    [Fact]
    public async Task Delete_RemovesSubtreeAndItsCases_AndTouchesPlans()
    {
        var (client, projectId, suiteId) = await SetUpAsync();
        var checkout = await client.CreateSectionAsync(projectId, suiteId, "Checkout");
        var cards = await client.CreateSectionAsync(projectId, suiteId, "Cards", checkout.Id);
        var nestedCase = await client.CreateCaseAsync(
            projectId,
            suiteId,
            "Pay",
            sectionId: cards.Id
        );
        var rootCase = await client.CreateCaseAsync(projectId, suiteId, "Browse");
        var plan = await client.CreatePlanAsync(projectId);
        await client.AddCaseToPlanAsync(projectId, plan.Id, nestedCase.Id);
        var planBefore = await client.GetPlanAsync(projectId, plan.Id);

        var response = await client.DeleteAsync(
            $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{checkout.Id}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (
            await client.GetAsync(
                $"/api/v1/projects/{projectId}/suites/{suiteId}/sections/{cards.Id}"
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.NotFound);
        var cases = await (
            await client.GetAsync($"/api/v1/projects/{projectId}/suites/{suiteId}/cases")
        ).Content.ReadFromJsonAsync<Paginated<TestCaseResponse>>();
        cases!.Items.Select(testCase => testCase.Id).Should().Equal(rootCase.Id);
        (await client.GetPlanAsync(projectId, plan.Id))
            .Version.Should()
            .BeGreaterThan(planBefore.Version);
    }
}
