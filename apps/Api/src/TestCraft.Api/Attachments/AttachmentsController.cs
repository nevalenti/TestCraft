using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Attachments;
using TestCraft.Application.Attachments.Commands.DeleteAttachment;
using TestCraft.Application.Attachments.Commands.UploadAttachment;
using TestCraft.Application.Attachments.Queries.GetAttachmentDownloadUrl;
using TestCraft.Application.Attachments.Queries.GetAttachments;

namespace TestCraft.Api.Attachments;

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
    public async Task<ActionResult<IReadOnlyList<AttachmentResponse>>> GetAll(
        Guid projectId,
        Guid runId,
        Guid resultId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetAttachmentsQuery
                {
                    ProjectId = projectId,
                    RunId = runId,
                    ResultId = resultId,
                },
                cancellationToken
            )
        );

    /// <summary>Uploads an attachment to a test result.</summary>
    [HttpPost]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<AttachmentResponse>> Upload(
        Guid projectId,
        Guid runId,
        Guid resultId,
        IFormFile file,
        CancellationToken cancellationToken
    )
    {
        await using var stream = file.OpenReadStream();

        var result = await sender.Send(
            new UploadAttachmentCommand
            {
                ProjectId = projectId,
                RunId = runId,
                ResultId = resultId,
                FileName = file.FileName,
                ContentType = file.ContentType,
                SizeBytes = file.Length,
                Content = stream,
            },
            cancellationToken
        );

        return Created(string.Empty, result);
    }

    /// <summary>Returns a presigned download URL for an attachment.</summary>
    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(
        Guid projectId,
        Guid runId,
        Guid resultId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var response = await sender.Send(
            new GetAttachmentDownloadUrlQuery
            {
                ProjectId = projectId,
                RunId = runId,
                ResultId = resultId,
                AttachmentId = id,
            },
            cancellationToken
        );

        return Ok(response);
    }

    /// <summary>Deletes an attachment.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid runId,
        Guid resultId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteAttachmentCommand
            {
                ProjectId = projectId,
                RunId = runId,
                ResultId = resultId,
                AttachmentId = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
