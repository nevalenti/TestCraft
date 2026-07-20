using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.ShareTokens;

namespace TestCraft.Api.IntegrationTests.ShareTokens;

[Collection(ApiCollection.Name)]
public class ShareTokensApiTests(ApiFactory factory)
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
    public async Task Create_Then_GetAll_ReturnsToken()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
            new CreateShareToken.Command()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<ShareTokenResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.TestRunId.Should().Be(run.Id);
        created.Token.Should().NotBeNullOrWhiteSpace();

        var listResponse = await client.GetAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share"
        );
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var tokens = await listResponse.Content.ReadFromJsonAsync<
            IReadOnlyList<ShareTokenResponse>
        >(ApiTestHelpers.JsonOptions);
        tokens.Should().ContainSingle(t => t.Id == created.Id);
    }

    [Fact]
    public async Task GetByToken_PublicEndpoint_ReturnsRunSummary()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id, "Public Run");

        var shareResponse = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
            new CreateShareToken.Command()
        );

        var shareToken = await shareResponse.Content.ReadFromJsonAsync<ShareTokenResponse>(
            ApiTestHelpers.JsonOptions
        );

        var publicClient = factory.CreateClient();
        var response = await publicClient.GetAsync($"/api/v1/share/{shareToken!.Token}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var shared = await response.Content.ReadFromJsonAsync<SharedRunResponse>(
            ApiTestHelpers.JsonOptions
        );
        shared!.RunName.Should().Be("Public Run");
    }

    [Fact]
    public async Task GetByToken_InvalidToken_ReturnsNotFound()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/share/invalid-token-abc");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Revoke_RemovesToken()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/runs/{run.Id}/share",
                new CreateShareToken.Command()
            )
        ).Content.ReadFromJsonAsync<ShareTokenResponse>(ApiTestHelpers.JsonOptions);

        var revokeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/share/{created!.Id}"
        );
        revokeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var publicClient = factory.CreateClient();
        var getResponse = await publicClient.GetAsync($"/api/v1/share/{created.Token}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();
        var run = await owner.CreateRunAsync(project.Id);

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/share");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
