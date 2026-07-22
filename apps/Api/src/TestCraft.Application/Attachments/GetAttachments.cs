using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Attachments;

public static class GetAttachments
{
    /// <summary>Lists the attachments on a test result.</summary>
    public sealed record Query : IRequest<IReadOnlyList<AttachmentResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the test result belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run the test result belongs to.</summary>
        public required Guid RunId { get; init; }

        /// <summary>The test result to list attachments for.</summary>
        public required Guid ResultId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, IReadOnlyList<AttachmentResponse>>
    {
        public async Task<IReadOnlyList<AttachmentResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .Attachments.Where(attachment =>
                    attachment.TestResultId == request.ResultId
                    && attachment.TestResult!.TestRunId == request.RunId
                    && attachment.TestResult.TestRun!.ProjectId == request.ProjectId
                )
                .OrderBy(attachment => attachment.CreatedAt)
                .Select(attachment => new AttachmentResponse
                {
                    Id = attachment.Id,
                    TestResultId = attachment.TestResultId,
                    FileName = attachment.FileName,
                    ContentType = attachment.ContentType,
                    SizeBytes = attachment.SizeBytes,
                    CreatedAt = attachment.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
