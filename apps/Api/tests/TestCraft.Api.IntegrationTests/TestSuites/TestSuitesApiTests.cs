using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestSuites;

namespace TestCraft.Api.IntegrationTests.TestSuites;

[Collection(ApiCollection.Name)]
public class TestSuitesApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsSuite()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites",
            new CreateTestSuite.Command { Name = "Login Suite", Description = "Covers login flows" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestSuiteResponse>();
        created!.Name.Should().Be("Login Suite");
        created.Description.Should().Be("Covers login flows");
        created.ProjectId.Should().Be(project.Id);

        var getResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{created.Id}"
        );
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestSuiteResponse>();
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task Names_AreUniqueAmongActiveSuitesInOneProject()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var otherProject = await client.CreateProjectAsync("Other Project");
        var first = await client.CreateSuiteAsync(project.Id, "Regression");
        var second = await client.CreateSuiteAsync(project.Id, "Smoke");

        (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/suites",
                new CreateTestSuite.Command { Name = "Regression" }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.Conflict);
        (
            await client.UpdateAsJsonAsync(
                $"/api/v1/projects/{project.Id}/suites/{second.Id}",
                new UpdateTestSuite.Command { Name = "Regression" }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.Conflict);

        (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{otherProject.Id}/suites",
                new CreateTestSuite.Command { Name = "Regression" }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.Created);

        (await client.DeleteAsync($"/api/v1/projects/{project.Id}/suites/{first.Id}"))
            .StatusCode.Should()
            .Be(HttpStatusCode.NoContent);
        (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/suites",
                new CreateTestSuite.Command { Name = "Regression" }
            )
        )
            .StatusCode.Should()
            .Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreateSuiteAsync(project.Id, "Login Suite");
        await client.CreateSuiteAsync(project.Id, "Checkout Suite");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/suites?search=Login");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestSuiteResponse>>();
        page!.Items.Should().ContainSingle(suite => suite.Name == "Login Suite");
        page.Items.Should().NotContain(suite => suite.Name == "Checkout Suite");
    }

    [Fact]
    public async Task GetAll_SearchTreatsLikeWildcardsAsLiteralText()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        await client.CreateSuiteAsync(project.Id, "100% Coverage");
        await client.CreateSuiteAsync(project.Id, "snake_case");
        await client.CreateSuiteAsync(project.Id, "path\\name");
        await client.CreateSuiteAsync(project.Id, "plain suite");

        async Task<IReadOnlyList<string>> SearchAsync(string term)
        {
            var response = await client.GetAsync(
                $"/api/v1/projects/{project.Id}/suites?search={Uri.EscapeDataString(term)}"
            );
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var page = await response.Content.ReadFromJsonAsync<Paginated<TestSuiteResponse>>();
            return page!.Items.Select(suite => suite.Name).ToList();
        }

        (await SearchAsync("%")).Should().Equal("100% Coverage");
        (await SearchAsync("_")).Should().Equal("snake_case");
        (await SearchAsync("\\")).Should().Equal("path\\name");
        (await SearchAsync("coverage")).Should().Equal("100% Coverage");
    }

    [Fact]
    public async Task Update_ChangesNameAndDescription()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id, "Old Name");

        var updateResponse = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}",
            new UpdateTestSuite.Command
            {
                Id = suite.Id,
                Name = "New Name",
                Description = "Updated description",
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestSuiteResponse>();
        updated!.Name.Should().Be("New Name");
        updated.Description.Should().Be("Updated description");
    }

    [Fact]
    public async Task Update_NonExistentSuite_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suiteId = TestSuiteId.New();

        var response = await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites/{suiteId}",
            new UpdateTestSuite.Command { Id = suiteId, Name = "Doesn't matter" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Delete_RemovesSuite()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id, "To Delete");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/suites/{suite.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var suite = await ownerClient.CreateSuiteAsync(project.Id, "Private Suite");

        var response = await otherClient.GetAsync(
            $"/api/v1/projects/{project.Id}/suites/{suite.Id}"
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/suites",
            new CreateTestSuite.Command { Name = "Nope" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/suites",
            new CreateTestSuite.Command { Name = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
