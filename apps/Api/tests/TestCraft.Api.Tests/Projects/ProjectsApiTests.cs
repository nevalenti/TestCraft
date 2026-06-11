using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.Projects;
using TestCraft.Api.Tests.Infrastructure;
using TestCraft.Application.Projects;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Tests.Projects;

[Collection(ApiCollection.Name)]
public class ProjectsApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsProject()
    {
        var client = CreateClient(Guid.NewGuid());

        var createResponse = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = "My Project", Description = "A test project" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        created.Should().NotBeNull();
        created!.Name.Should().Be("My Project");
        created.Description.Should().Be("A test project");
        created.SuiteCount.Should().Be(0);
        created.RunCount.Should().Be(0);

        var getResponse = await client.GetAsync($"/api/v1/projects/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        fetched!.Id.Should().Be(created.Id);
        fetched.Name.Should().Be("My Project");
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyCurrentUsersProjects()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        await ownerClient.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = "Owner Project" }
        );
        await otherClient.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = "Other Project" }
        );

        var response = await ownerClient.GetAsync("/api/v1/projects");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<ProjectResponse>>();
        page!.Items.Should().ContainSingle(p => p.Name == "Owner Project");
        page.Items.Should().NotContain(p => p.Name == "Other Project");
    }

    [Fact]
    public async Task Update_ChangesName()
    {
        var client = CreateClient(Guid.NewGuid());

        var created = await (
            await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "Old Name" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>();

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{created!.Id}",
            new UpdateProjectRequest { Name = "New Name" }
        );
        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        updated!.Name.Should().Be("New Name");
    }

    [Fact]
    public async Task Delete_RemovesProject()
    {
        var client = CreateClient(Guid.NewGuid());

        var created = await (
            await client.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "To Delete" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>();

        var deleteResponse = await client.DeleteAsync($"/api/v1/projects/{created!.Id}");
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var created = await (
            await ownerClient.PostAsJsonAsync(
                "/api/v1/projects",
                new CreateProjectRequest { Name = "Private Project" }
            )
        ).Content.ReadFromJsonAsync<ProjectResponse>();

        var response = await otherClient.GetAsync($"/api/v1/projects/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = "Nope" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.PostAsJsonAsync(
            "/api/v1/projects",
            new CreateProjectRequest { Name = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
