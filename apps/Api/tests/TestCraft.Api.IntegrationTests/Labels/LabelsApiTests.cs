using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Labels;

namespace TestCraft.Api.IntegrationTests.Labels;

[Collection(ApiCollection.Name)]
public class LabelsApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetAll_ReturnsLabel()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await client.CreateLabelAsync(project.Id, "Bug", "#FF0000");

        created.Name.Should().Be("Bug");
        created.Color.Should().Be("#FF0000");
        created.ProjectId.Should().Be(project.Id);

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/labels");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var labels = await response.Content.ReadFromJsonAsync<IReadOnlyList<LabelResponse>>(
            ApiTestHelpers.JsonOptions
        );
        labels.Should().ContainSingle(l => l.Id == created.Id);
    }

    [Fact]
    public async Task Create_InvalidColor_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/labels",
            new CreateLabel.Command { Name = "Bug", Color = "not-a-color" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_ChangesNameAndColor()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var label = await client.CreateLabelAsync(project.Id, "Bug", "#FF0000");

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/labels/{label.Id}",
            new UpdateLabel.Command
            {
                Id = label.Id,
                Name = "Flaky",
                Color = "#FFA500",
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<LabelResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Name.Should().Be("Flaky");
        updated.Color.Should().Be("#FFA500");
    }

    [Fact]
    public async Task Delete_RemovesLabel()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var label = await client.CreateLabelAsync(project.Id, "ToDelete", "#000000");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/labels/{label.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var listResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/labels");
        var labels = await listResponse.Content.ReadFromJsonAsync<IReadOnlyList<LabelResponse>>(
            ApiTestHelpers.JsonOptions
        );
        labels.Should().NotContain(l => l.Id == label.Id);
    }

    [Fact]
    public async Task AssignLabel_Then_RemoveLabel_WorksOnTestCase()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Login Test");
        var label = await client.CreateLabelAsync(project.Id, "Smoke", "#00FF00");

        var assignResponse = await client.PostAsync(
            $"/api/v1/projects/{project.Id}/cases/{testCase.Id}/labels/{label.Id}",
            null
        );
        assignResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var removeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/cases/{testCase.Id}/labels/{label.Id}"
        );
        removeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task AssignLabel_Idempotent_DoesNotError()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var label = await client.CreateLabelAsync(project.Id);

        await client.PostAsync(
            $"/api/v1/projects/{project.Id}/cases/{testCase.Id}/labels/{label.Id}",
            null
        );
        var second = await client.PostAsync(
            $"/api/v1/projects/{project.Id}/cases/{testCase.Id}/labels/{label.Id}",
            null
        );

        second.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        await owner.CreateLabelAsync(project.Id);

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/labels");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/labels",
            new CreateLabel.Command { Name = "Bug", Color = "#FF0000" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
