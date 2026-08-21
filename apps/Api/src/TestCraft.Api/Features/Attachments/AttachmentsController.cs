using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Attachments;

namespace TestCraft.Api.Features.Attachments;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route(
    "api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results/{resultId:guid}/attachments"
)]
public class AttachmentsController(ISender sender) : ControllerBase
{
    /// <summary>Lists attachments for a test result.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AttachmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AttachmentResponse>>> GetAll(
        ProjectId projectId,
        TestRunId runId,
        TestResultId resultId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetAttachments.Query
        {
            ProjectId = projectId,
            RunId = runId,
            ResultId = resultId,
        };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Uploads an attachment to a test result.</summary>
    [HttpPost]
    [RequestSizeLimit(52_428_800)]
    [ProducesResponseType(typeof(AttachmentResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<AttachmentResponse>> Upload(
        ProjectId projectId,
        TestRunId runId,
        TestResultId resultId,
        IFormFile file,
        CancellationToken cancellationToken
    )
    {
        await using var stream = file.OpenReadStream();

        var command = new UploadAttachment.Command
        {
            ProjectId = projectId,
            RunId = runId,
            ResultId = resultId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            Content = stream,
        };
        var result = await sender.Send(command, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Returns a presigned download URL for an attachment.</summary>
    [HttpGet("{id:guid}/download")]
    [ProducesResponseType(typeof(AttachmentDownloadUrlResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AttachmentDownloadUrlResponse>> Download(
        ProjectId projectId,
        TestRunId runId,
        TestResultId resultId,
        AttachmentId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetAttachmentDownloadUrl.Query
        {
            ProjectId = projectId,
            RunId = runId,
            ResultId = resultId,
            AttachmentId = id,
        };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes an attachment.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestRunId runId,
        TestResultId resultId,
        AttachmentId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteAttachment.Command
        {
            ProjectId = projectId,
            RunId = runId,
            ResultId = resultId,
            AttachmentId = id,
        };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
