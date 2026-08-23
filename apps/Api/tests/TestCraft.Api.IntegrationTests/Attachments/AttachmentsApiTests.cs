using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;

using FluentAssertions;

using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Application.Features.Attachments;

namespace TestCraft.Api.IntegrationTests.Attachments;

[Collection(ApiCollection.Name)]
public class AttachmentsApiTests(ApiFactory factory)
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
        string fileName = "screenshot.png",
        string contentType = "image/png"
    )
    {
        var bytes = "fake-image-content"u8.ToArray();
        var fileContent = new ByteArrayContent(bytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        var form = new MultipartFormDataContent();
        form.Add(fileContent, "file", fileName);
        return form;
    }

    private static string AttachmentsUrl(
        ProjectId projectId,
        TestRunId runId,
        TestResultId resultId
    ) => $"/api/v1/projects/{projectId}/runs/{runId}/results/{resultId}/attachments";

    private static async Task<(
        ProjectId ProjectId,
        TestRunId RunId,
        TestResultId ResultId
    )> CreateProjectRunResultAsync(HttpClient client)
    {
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);
        var result = await client.CreateResultAsync(project.Id, run.Id, testCase.Id);

        return (project.Id, run.Id, result.Id);
    }

    [Fact]
    public async Task GetAll_NewResult_ReturnsEmptyList()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var response = await client.GetAsync(AttachmentsUrl(projectId, runId, resultId));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var attachments = await response.Content.ReadFromJsonAsync<List<AttachmentResponse>>(
            ApiTestHelpers.JsonOptions
        );
        attachments.Should().BeEmpty();
    }

    [Fact]
    public async Task Upload_ValidFile_ReturnsCreatedAttachment()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var response = await client.PostAsync(
            AttachmentsUrl(projectId, runId, resultId),
            BuildFileContent("report.png", "image/png")
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var attachment = await response.Content.ReadFromJsonAsync<AttachmentResponse>(
            ApiTestHelpers.JsonOptions
        );
        attachment!.FileName.Should().Be("report.png");
        attachment.ContentType.Should().Be("image/png");
        attachment.TestResultId.Should().Be(resultId);
    }

    [Fact]
    public async Task Upload_ThenGetAll_ReturnsUploadedAttachment()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        await client.PostAsync(
            AttachmentsUrl(projectId, runId, resultId),
            BuildFileContent("log.txt", "text/plain")
        );

        var listResponse = await client.GetAsync(AttachmentsUrl(projectId, runId, resultId));
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var attachments = await listResponse.Content.ReadFromJsonAsync<List<AttachmentResponse>>(
            ApiTestHelpers.JsonOptions
        );
        attachments.Should().ContainSingle(attachment => attachment.FileName == "log.txt");
    }

    [Fact]
    public async Task Delete_RemovesAttachment()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var uploadResponse = await client.PostAsync(
            AttachmentsUrl(projectId, runId, resultId),
            BuildFileContent("to-delete.png", "image/png")
        );
        var attachment = await uploadResponse.Content.ReadFromJsonAsync<AttachmentResponse>(
            ApiTestHelpers.JsonOptions
        );

        var deleteResponse = await client.DeleteAsync(
            $"{AttachmentsUrl(projectId, runId, resultId)}/{attachment!.Id}"
        );
        deleteResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var listResponse = await client.GetAsync(AttachmentsUrl(projectId, runId, resultId));
        var remaining = await listResponse.Content.ReadFromJsonAsync<List<AttachmentResponse>>(
            ApiTestHelpers.JsonOptions
        );
        remaining.Should().BeEmpty();
    }

    [Fact]
    public async Task GetDownloadUrl_ReturnsUrlForAttachment()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var uploadResponse = await client.PostAsync(
            AttachmentsUrl(projectId, runId, resultId),
            BuildFileContent("evidence.png", "image/png")
        );
        var attachment = await uploadResponse.Content.ReadFromJsonAsync<AttachmentResponse>(
            ApiTestHelpers.JsonOptions
        );

        var downloadResponse = await client.GetAsync(
            $"{AttachmentsUrl(projectId, runId, resultId)}/{attachment!.Id}/download"
        );

        downloadResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var urlResponse =
            await downloadResponse.Content.ReadFromJsonAsync<AttachmentDownloadUrlResponse>(
                ApiTestHelpers.JsonOptions
            );
        urlResponse!.Url.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetAll_OtherUsersProject_ReturnsNotFound()
    {
        var ownerClient = CreateClient(Guid.NewGuid());
        var otherClient = CreateClient(Guid.NewGuid());

        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(ownerClient);

        var response = await otherClient.GetAsync(AttachmentsUrl(projectId, runId, resultId));

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Upload_WithoutAuth_ReturnsUnauthorized()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsync(
            AttachmentsUrl(ProjectId.New(), TestRunId.New(), TestResultId.New()),
            BuildFileContent()
        );

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Upload_NonExistentResult_ReturnsNotFound()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);

        var response = await client.PostAsync(
            AttachmentsUrl(project.Id, run.Id, TestResultId.New()),
            BuildFileContent()
        );

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Upload_EmptyFile_ReturnsCreatedAttachmentWithZeroSize()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var form = new MultipartFormDataContent();
        var emptyContent = new ByteArrayContent([]);
        emptyContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        form.Add(emptyContent, "file", "empty.png");

        var response = await client.PostAsync(AttachmentsUrl(projectId, runId, resultId), form);

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var attachment = await response.Content.ReadFromJsonAsync<AttachmentResponse>(
            ApiTestHelpers.JsonOptions
        );
        attachment!.SizeBytes.Should().Be(0);
    }

    [Fact]
    public async Task Upload_DisallowedContentType_IsCurrentlyAccepted()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var response = await client.PostAsync(
            AttachmentsUrl(projectId, runId, resultId),
            BuildFileContent("payload.exe", "application/x-msdownload")
        );

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var attachment = await response.Content.ReadFromJsonAsync<AttachmentResponse>(
            ApiTestHelpers.JsonOptions
        );
        attachment!.ContentType.Should().Be("application/x-msdownload");
    }

    [Fact]
    public async Task Upload_FileExceedingConfiguredSizeLimit_ReturnsValidationProblem()
    {
        var client = CreateClient(Guid.NewGuid());
        var (projectId, runId, resultId) = await CreateProjectRunResultAsync(client);

        var oversizedBytes = new byte[52_428_800 + 1];
        var fileContent = new ByteArrayContent(oversizedBytes);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        var form = new MultipartFormDataContent();
        form.Add(fileContent, "file", "huge.png");

        var response = await client.PostAsync(AttachmentsUrl(projectId, runId, resultId), form);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }
}
