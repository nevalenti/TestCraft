using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Attachments;

public static class GetAttachmentDownloadUrl
{
    public sealed record Query : IRequest<AttachmentDownloadUrlResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid RunId { get; init; }
        public required Guid ResultId { get; init; }
        public required Guid AttachmentId { get; init; }
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
                await context.Attachments.FirstOrDefaultAsync(
                    a =>
                        a.Id == request.AttachmentId
                        && a.TestResultId == request.ResultId
                        && a.TestResult!.TestRunId == request.RunId
                        && a.TestResult.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            var url = await storage.GetPresignedUrlAsync(
                attachment.StorageKey,
                TimeSpan.FromMinutes(15),
                cancellationToken
            );

            return new AttachmentDownloadUrlResponse { Url = url };
        }
    }
}
