using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Attachments;

public static class GetAttachmentDownloadUrl
{
    public sealed record Query : IRequest<AttachmentDownloadUrlResponse>, IProjectScopedRequest
    {
        public ProjectId ProjectId { get; init; }

        public required TestRunId RunId { get; init; }

        public required TestResultId ResultId { get; init; }

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
            var attachment = await context
                .Attachments.AsNoTracking()
                .FirstOrNotFoundAsync(
                    attachmentEntity =>
                        attachmentEntity.Id == request.AttachmentId
                        && attachmentEntity.TestResultId == request.ResultId
                        && attachmentEntity.TestResult!.TestRunId == request.RunId
                        && attachmentEntity.TestResult.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                );

            var url = await storage.GetPresignedUrlAsync(
                attachment.StorageKey,
                TimeSpan.FromMinutes(15),
                cancellationToken
            );

            return new AttachmentDownloadUrlResponse { Url = url };
        }
    }
}
