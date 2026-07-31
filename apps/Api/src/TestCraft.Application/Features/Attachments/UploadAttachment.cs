using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Attachments;

/// <summary>A file attached to a test result.</summary>
public record AttachmentResponse
{
    /// <summary>The attachment's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The test result this attachment belongs to.</summary>
    public required Guid TestResultId { get; init; }

    /// <summary>The original file name.</summary>
    public required string FileName { get; init; }

    /// <summary>The file's MIME type.</summary>
    public required string ContentType { get; init; }

    /// <summary>The file size, in bytes.</summary>
    public required long SizeBytes { get; init; }

    /// <summary>When the attachment was uploaded.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

/// <summary>A presigned URL for downloading an attachment's file.</summary>
public record AttachmentDownloadUrlResponse
{
    /// <summary>The presigned download URL. Time-limited.</summary>
    public required string Url { get; init; }
}

public static class UploadAttachment
{
    /// <summary>Uploads a file and attaches it to a test result.</summary>
    public sealed record Command : IRequest<AttachmentResponse>, IProjectScopedRequest
    {
        /// <summary>The project the test result belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run the test result belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The test result to attach the file to.</summary>
        public required Guid ResultId { get; init; }

        /// <summary>The original file name.</summary>
        public required string FileName { get; init; }

        /// <summary>The file's MIME type.</summary>
        public required string ContentType { get; init; }

        /// <summary>The file size, in bytes.</summary>
        public required long SizeBytes { get; init; }

        /// <summary>The file content stream.</summary>
        public required Stream Content { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IStorageService storage
    ) : IRequestHandler<Command, AttachmentResponse>
    {
        public async Task<AttachmentResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var resultExists = await context.TestResults.AnyAsync(
                testResult =>
                    testResult.Id == request.ResultId
                    && testResult.TestRunId == request.RunId
                    && testResult.TestRun!.ProjectId == request.ProjectId,
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
}
