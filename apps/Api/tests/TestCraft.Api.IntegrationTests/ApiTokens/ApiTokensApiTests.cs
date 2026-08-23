using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using FluentAssertions;

using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.ApiTokens;

namespace TestCraft.Api.IntegrationTests.ApiTokens;

[Collection(ApiCollection.Name)]
public class ApiTokensApiTests(ApiFactory factory)
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
    public async Task Create_ReturnsRawTokenOnce()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "CI Token" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<CreateApiTokenResponse>(
            ApiTestHelpers.JsonOptions
        );
        created!.Name.Should().Be("CI Token");
        created.Token.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GetAll_ListsTokensWithoutRawValue()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "My Token" }
        );

        var response = await client.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var tokens = await response.Content.ReadFromJsonAsync<IReadOnlyList<ApiTokenResponse>>(
            ApiTestHelpers.JsonOptions
        );
        tokens.Should().ContainSingle(token => token.Name == "My Token" && !token.IsRevoked);
    }

    [Fact]
    public async Task Revoke_MarksTokenRevoked()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var created = await (
            await client.PostAsJsonAsync(
                $"/api/v1/projects/{project.Id}/tokens",
                new CreateApiToken.Command { Name = "Revokable" }
            )
        ).Content.ReadFromJsonAsync<CreateApiTokenResponse>(ApiTestHelpers.JsonOptions);

        var revokeResponse = await client.DeleteAsync(
            $"/api/v1/projects/{project.Id}/tokens/{created!.Id}"
        );
        revokeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var tokens = await (
            await client.GetAsync($"/api/v1/projects/{project.Id}/tokens")
        ).Content.ReadFromJsonAsync<IReadOnlyList<ApiTokenResponse>>(ApiTestHelpers.JsonOptions);

        tokens.Should().ContainSingle(token => token.Id == created.Id && token.IsRevoked);
    }

    [Fact]
    public async Task Create_InvalidName_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/tokens",
            new CreateApiToken.Command { Name = "" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var other = CreateClient(Guid.NewGuid());

        var project = await owner.CreateProjectAsync();

        var response = await other.GetAsync($"/api/v1/projects/{project.Id}/tokens");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Create_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            $"/api/v1/projects/{Guid.NewGuid()}/tokens",
            new CreateApiToken.Command { Name = "Token" }
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
