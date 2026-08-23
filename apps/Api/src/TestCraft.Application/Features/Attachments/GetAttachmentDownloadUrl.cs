using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Attachments;

public static class GetAttachmentDownloadUrl
{
    /// <summary>Requests a presigned download URL for an attachment.</summary>
    public sealed record Query : IRequest<AttachmentDownloadUrlResponse>, IProjectScopedRequest
    {
        /// <summary>The project the attachment belongs to.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>The run the attachment belongs to.</summary>
        public required TestRunId RunId { get; init; }

        /// <summary>The test result the attachment belongs to.</summary>
        public required TestResultId ResultId { get; init; }

        /// <summary>The attachment to generate a download URL for.</summary>
        public required AttachmentId AttachmentId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, IStorageService storage)
        : IRequestHandler<Query, AttachmentDownloadUrlResponse>
    {
        public async Task<AttachmentDownloadUrlResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var attachment =
                await context
                    .Attachments.AsNoTracking()
                    .FirstOrDefaultAsync(
                        attachmentEntity =>
                            attachmentEntity.Id == request.AttachmentId
                            && attachmentEntity.TestResultId == request.ResultId
                            && attachmentEntity.TestResult!.TestRunId == request.RunId
                            && attachmentEntity.TestResult.TestRun!.ProjectId == request.ProjectId,
                        cancellationToken
                    )
                ?? throw new NotFoundException();

            var url = await storage.GetPresignedUrlAsync(
                attachment.StorageKey,
                TimeSpan.FromMinutes(15),
                cancellationToken
            );

            return new AttachmentDownloadUrlResponse { Url = url };
        }
    }
}
