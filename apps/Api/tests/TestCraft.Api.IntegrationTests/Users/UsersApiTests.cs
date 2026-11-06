using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Users;

namespace TestCraft.Api.IntegrationTests.Users;

[Collection(ApiCollection.Name)]
public class UsersApiTests(ApiFactory factory)
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
    public async Task GetAvatarUrl_NoAvatarSet_ReturnsNullUrl()
    {
        var client = CreateClient(Guid.NewGuid());

        var response = await client.GetAsync("/api/v1/account/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<AvatarUrlResponse>())!.Url.Should().BeNull();
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

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task GetAvatarUrl_IsIsolatedPerUser()
    {
        var uploader = CreateClient(Guid.NewGuid());
        var otherUser = CreateClient(Guid.NewGuid());

        await uploader.PutAsync("/api/v1/account/avatar", BuildFileContent());

        var response = await otherUser.GetAsync("/api/v1/account/avatar");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<AvatarUrlResponse>())!.Url.Should().BeNull();
    }

    [Fact]
    public async Task UploadAvatar_Twice_KeepsOnlyTheLatestObject()
    {
        var userId = Guid.NewGuid();
        var client = CreateClient(userId);
        var storage = (FakeStorageService)factory.Services.GetRequiredService<IStorageService>();

        await client.PutAsync("/api/v1/account/avatar", BuildFileContent());
        await client.PutAsync("/api/v1/account/avatar", BuildFileContent("new.jpg", "image/jpeg"));

        storage.CountObjectsUnder($"avatars/{userId}/").Should().Be(1);
    }

    [Fact]
    public async Task UploadAvatar_WhenTheNewUploadFails_KeepsThePreviousAvatar()
    {
        var storage = new UploadFailingStorage();
        await using var failingFactory = factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services => services.AddSingleton<IStorageService>(storage))
        );
        var userId = Guid.NewGuid();
        var client = failingFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );
        var first = await client.PutAsync("/api/v1/account/avatar", BuildFileContent());
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        var before = await (
            await client.GetAsync("/api/v1/account/avatar")
        ).Content.ReadFromJsonAsync<AvatarUrlResponse>(ApiTestHelpers.JsonOptions);

        storage.FailUploads = true;
        var failed = await client.PutAsync("/api/v1/account/avatar", BuildFileContent());

        failed.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        storage.CountObjectsUnder($"avatars/{userId}/").Should().Be(1);
        var after = await (
            await client.GetAsync("/api/v1/account/avatar")
        ).Content.ReadFromJsonAsync<AvatarUrlResponse>(ApiTestHelpers.JsonOptions);
        after!.Url.Should().Be(before!.Url);
    }

    private sealed class UploadFailingStorage : FakeStorageService
    {
        public bool FailUploads { get; set; }

        public override Task<string> UploadAsync(
            string key,
            Stream content,
            string contentType,
            CancellationToken cancellationToken = default
        ) =>
            FailUploads
                ? throw new InvalidOperationException("Simulated upload failure")
                : base.UploadAsync(key, content, contentType, cancellationToken);
    }
}
