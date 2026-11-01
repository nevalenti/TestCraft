using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Projects;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Projects;

[Collection(ApiCollection.Name)]
public class ProjectDetailsApiTests(ApiFactory factory)
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
    public async Task GetById_ReportsRecentPassRatesOldestFirstAndLastRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id, "Case");
        var otherCase = await client.CreateCaseAsync(project.Id, suite.Id, "Other");

        var older = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(project.Id, older.Id, testCase.Id);
        await client.CreateResultAsync(project.Id, older.Id, otherCase.Id, TestResultStatus.Failed);
        await client.CompleteRunAsync(project.Id, older);

        var newer = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(project.Id, newer.Id, testCase.Id);
        var reset = await client.CreateResultAsync(project.Id, newer.Id, otherCase.Id);
        await client.UpdateAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{newer.Id}/results/{reset.Id}",
            new UpdateTestResult.Command { Status = TestResultStatus.Untested }
        );
        await client.CompleteRunAsync(project.Id, newer);

        var active = await client.CreateRunAsync(project.Id);
        await client.CreateResultAsync(project.Id, active.Id, testCase.Id, TestResultStatus.Failed);

        var fetched = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}")
        ).Content.ReadFromJsonAsync<ProjectResponse>();

        fetched!.RecentPassRates.Should().Equal(50m, 100m);
        fetched.LastRunAt.Should().Be(active.CreatedAt);
    }

    [Fact]
    public async Task Create_WithoutRuns_HasNoHealth()
    {
        var client = CreateClient(Guid.NewGuid());

        var project = await client.CreateProjectAsync();

        project.RecentPassRates.Should().BeEmpty();
        project.LastRunAt.Should().BeNull();
        project.Role.Should().Be(ProjectRole.Owner);
        project.Version.Should().Be(1);
    }

    [Fact]
    public async Task Update_WithCurrentETag_BumpsVersionAndETag()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var read = await client.GetAsync($"/api/v1/projects/{project.Id}");

        var response = await SendUpdateAsync(client, project.Id, read.Headers.ETag!.Tag);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.ETag!.Tag.Should().Be("\"2\"");
        (await response.Content.ReadFromJsonAsync<ProjectResponse>())!.Version.Should().Be(2);
    }

    [Fact]
    public async Task Update_WithStaleETag_ReturnsPreconditionFailed()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        await SendUpdateAsync(client, project.Id, "\"1\"");

        var response = await SendUpdateAsync(client, project.Id, "\"1\"");

        response.StatusCode.Should().Be(HttpStatusCode.PreconditionFailed);
    }

    [Fact]
    public async Task Update_ByMember_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        var email = $"{memberId}@example.com";
        factory.RegisterUser(email, memberId);
        var project = await ownerClient.CreateProjectAsync();
        await ownerClient.AddMemberAsync(project.Id, email);

        var response = await SendUpdateAsync(CreateClient(memberId), project.Id, "\"1\"");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAll_ReportsEachCallersRole()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var memberId = Guid.NewGuid();
        var email = $"{memberId}@example.com";
        factory.RegisterUser(email, memberId);
        var project = await ownerClient.CreateProjectAsync();
        await ownerClient.AddMemberAsync(project.Id, email);

        var listed = await (
            await CreateClient(memberId).GetAsync("/api/v1/projects")
        ).Content.ReadFromJsonAsync<Paginated<ProjectResponse>>();

        var seen = listed!.Items.Should().ContainSingle().Subject;
        seen.Role.Should().Be(ProjectRole.Editor);
        seen.IsOwner.Should().BeFalse();
    }

    [Fact]
    public async Task GetAll_SortsByNameWhenAsked()
    {
        var client = CreateClient(Guid.NewGuid());
        await client.CreateProjectAsync("Bravo");
        await client.CreateProjectAsync("Alpha");
        await client.CreateProjectAsync("Charlie");

        var listed = await (
            await client.GetAsync("/api/v1/projects?sort_by=name&sort_dir=asc")
        ).Content.ReadFromJsonAsync<Paginated<ProjectResponse>>();

        listed!.Items.Select(project => project.Name).Should().Equal("Alpha", "Bravo", "Charlie");
    }

    [Theory]
    [InlineData("sort_by=title")]
    [InlineData("page=0")]
    [InlineData("page_size=501")]
    [InlineData("page=2001&page_size=100")]
    public async Task GetAll_RejectsInvalidQuery(string query)
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.GetAsync($"/api/v1/projects?{query}");

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    private static Task<HttpResponseMessage> SendUpdateAsync(
        HttpClient client,
        ProjectId projectId,
        string? ifMatch
    )
    {
        var request = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/projects/{projectId}")
        {
            Content = WireJson.Content(new UpdateProject.Command { Name = "Renamed" }),
        };
        if (ifMatch is not null)
        {
            request.Headers.TryAddWithoutValidation("If-Match", ifMatch);
        }

        return client.SendAsync(request);
    }
}
