using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Attachments.Commands.UploadAttachment;

public record UploadAttachmentCommand : IRequest<AttachmentResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid ResultId { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long SizeBytes { get; init; }
    public required Stream Content { get; init; }
}

public class UploadAttachmentCommandHandler(
    IApplicationDbContext context,
    ICurrentUser currentUser,
    IStorageService storage
) : IRequestHandler<UploadAttachmentCommand, AttachmentResponse>
{
    public async Task<AttachmentResponse> Handle(
        UploadAttachmentCommand request,
        CancellationToken cancellationToken
    )
    {
        var resultExists = await context.TestResults.AnyAsync(
            r =>
                r.Id == request.ResultId
                && r.TestRunId == request.RunId
                && r.TestRun!.ProjectId == request.ProjectId,
            cancellationToken
        );
        if (!resultExists)
        {
            throw new NotFoundException();
        }

        var storageKey =
            $"{request.ProjectId}/{request.ResultId}/{Guid.NewGuid()}/{request.FileName}";

        await storage.UploadAsync(
            storageKey,
            request.Content,
            request.ContentType,
            cancellationToken
        );

        var attachment = new Attachment
        {
            TestResultId = request.ResultId,
            FileName = request.FileName,
            ContentType = request.ContentType,
            SizeBytes = request.SizeBytes,
            StorageKey = storageKey,
            CreatedById = currentUser.UserId,
        };

        context.Attachments.Add(attachment);
        await context.SaveChangesAsync(cancellationToken);

        return new AttachmentResponse
        {
            Id = attachment.Id,
            TestResultId = attachment.TestResultId,
            FileName = attachment.FileName,
            ContentType = attachment.ContentType,
            SizeBytes = attachment.SizeBytes,
            CreatedAt = attachment.CreatedAt,
        };
    }
}
