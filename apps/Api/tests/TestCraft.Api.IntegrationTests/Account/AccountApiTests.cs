using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Users;

namespace TestCraft.Api.IntegrationTests.Account;

[Collection(ApiCollection.Name)]
public class AccountApiTests(ApiFactory factory)
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

    private static MultipartFormDataContent BuildFileContent(
        string fileName = "avatar.png",
        string contentType = "image/png"
    )
    {
        var bytes = "fake-avatar-content"u8.ToArray();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var form = new MultipartFormDataContent();
        form.Add(fileContent, "file", fileName);
        return form;
    }

    [Fact]
    public async Task GetAvatarUrl_NoAvatarSet_ReturnsNoContent()
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.GetAsync("/api/v1/account/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task UploadAvatar_Then_GetAvatarUrl_ReturnsUploadedAvatarUrl()
    {
        var client = CreateClient(Guid.NewGuid());

        var uploadResponse = await client.PutAsync("/api/v1/account/avatar", BuildFileContent());

        uploadResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var uploaded = await uploadResponse.Content.ReadFromJsonAsync<AvatarUrlResponse>(
            ApiTestHelpers.JsonOptions
        );
        uploaded!.Url.Should().NotBeNullOrEmpty();

        var getResponse = await client.GetAsync("/api/v1/account/avatar");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var fetched = await getResponse.Content.ReadFromJsonAsync<AvatarUrlResponse>(
            ApiTestHelpers.JsonOptions
        );
        fetched!.Url.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task UploadAvatar_Twice_ReplacesPreviousAvatar()
    {
        var client = CreateClient(Guid.NewGuid());

        var first = await client.PutAsync("/api/v1/account/avatar", BuildFileContent());
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var firstBody = await first.Content.ReadFromJsonAsync<AvatarUrlResponse>(
            ApiTestHelpers.JsonOptions
        );

        var second = await client.PutAsync(
            "/api/v1/account/avatar",
            BuildFileContent("new-avatar.jpg", "image/jpeg")
        );
        second.StatusCode.Should().Be(HttpStatusCode.OK);
        var secondBody = await second.Content.ReadFromJsonAsync<AvatarUrlResponse>(
            ApiTestHelpers.JsonOptions
        );

        secondBody!.Url.Should().NotBe(firstBody!.Url);
    }

    [Fact]
    public async Task GetAvatarUrl_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/account/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UploadAvatar_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PutAsync("/api/v1/account/avatar", BuildFileContent());

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UploadAvatar_NoFile_ReturnsBadRequest()
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.PutAsync(
            "/api/v1/account/avatar",
            new MultipartFormDataContent()
        );

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAvatarUrl_IsIsolatedPerUser()
    {
        var uploader = CreateClient(Guid.NewGuid());
        var otherUser = CreateClient(Guid.NewGuid());

        await uploader.PutAsync("/api/v1/account/avatar", BuildFileContent());

        var response = await otherUser.GetAsync("/api/v1/account/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }
}
