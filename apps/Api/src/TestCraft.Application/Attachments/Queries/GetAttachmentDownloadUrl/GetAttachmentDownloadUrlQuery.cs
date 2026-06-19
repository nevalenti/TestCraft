using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Attachments.Queries.GetAttachmentDownloadUrl;

public record GetAttachmentDownloadUrlQuery
    : IRequest<AttachmentDownloadUrlResponse>,
        IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid ResultId { get; init; }
    public required Guid AttachmentId { get; init; }
}

public class GetAttachmentDownloadUrlQueryHandler(
    IApplicationDbContext context,
    IStorageService storage
) : IRequestHandler<GetAttachmentDownloadUrlQuery, AttachmentDownloadUrlResponse>
{
    public async Task<AttachmentDownloadUrlResponse> Handle(
        GetAttachmentDownloadUrlQuery request,
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
