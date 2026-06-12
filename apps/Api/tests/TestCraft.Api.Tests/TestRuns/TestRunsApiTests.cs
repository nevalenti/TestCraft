using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.Tests.Infrastructure;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestRuns.Commands.CreateTestRun;
using TestCraft.Application.TestRuns.Commands.UpdateTestRun;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Tests.TestRuns;

[Collection(ApiCollection.Name)]
public class TestRunsApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetById_ReturnsRunWithDefaultActiveStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRunCommand { Name = "Smoke Run", Environment = "staging" }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Status.Should().Be(TestRunStatus.Active);
        created.ProjectId.Should().Be(project.Id);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{created.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Id.Should().Be(created.Id);
    }

    [Fact]
    public async Task Create_WithStatus_SetsStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var createResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRunCommand
            {
                Name = "Completed Run",
                Environment = "ci",
                Status = TestRunStatus.Completed,
            }
        );

        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await createResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task GetAll_FiltersBySearch()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.CreateRunAsync(project.Id, "Smoke Run");
        await client.CreateRunAsync(project.Id, "Regression Run");

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/runs?search=Smoke");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await response.Content.ReadFromJsonAsync<Paginated<TestRunResponse>>(
            ApiTestHelpers.JsonOptions
        );
        page!.Items.Should().ContainSingle(r => r.Name == "Smoke Run");
        page.Items.Should().NotContain(r => r.Name == "Regression Run");
    }

    [Fact]
    public async Task Update_ValidStatusTransition_Succeeds()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var updateResponse = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRunCommand
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Completed,
            }
        );

        updateResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await updateResponse.Content.ReadFromJsonAsync<TestRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        updated!.Status.Should().Be(TestRunStatus.Completed);
    }

    [Fact]
    public async Task Update_BackwardStatusTransition_ReturnsUnprocessable()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, status: TestRunStatus.Completed);

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}",
            new UpdateTestRunCommand
            {
                Id = run.Id,
                Name = run.Name,
                Environment = run.Environment,
                Status = TestRunStatus.Active,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Update_NonExistentRun_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var runId = Guid.NewGuid();

        var response = await client.PutAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{runId}",
            new UpdateTestRunCommand
            {
                Id = runId,
                Name = "Doesn't matter",
                Environment = "ci",
                Status = TestRunStatus.Active,
            }
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Delete_RemovesRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, "To Delete");

        var deleteResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getResponse = await client.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetSummary_NoResults_ReturnsZeroedTotals()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/summary"
        );
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await response.Content.ReadFromJsonAsync<TestRunStatusResponse>(
            ApiTestHelpers.JsonOptions
        );
        summary!.Total.Should().Be(0);
        summary.Passed.Should().Be(0);
        summary.Failed.Should().Be(0);
        summary.Blocked.Should().Be(0);
        summary.Skipped.Should().Be(0);
        summary.PassRate.Should().Be(0);
    }

    [Fact]
    public async Task GetById_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var project = await ownerClient.CreateProjectAsync();
        var run = await ownerClient.CreateRunAsync(project.Id, "Private Run");

        var response = await otherClient.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/runs",
            new CreateTestRunCommand { Name = "Nope", Environment = "ci" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Create_WithInvalidBody_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs",
            new CreateTestRunCommand { Name = "", Environment = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
