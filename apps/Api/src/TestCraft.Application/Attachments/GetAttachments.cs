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
                .Attachments.Where(a =>
                    a.TestResultId == request.ResultId
                    && a.TestResult!.TestRunId == request.RunId
                    && a.TestResult.TestRun!.ProjectId == request.ProjectId
                )
                .OrderBy(a => a.CreatedAt)
                .Select(a => new AttachmentResponse
                {
                    Id = a.Id,
                    TestResultId = a.TestResultId,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    SizeBytes = a.SizeBytes,
                    CreatedAt = a.CreatedAt,
                })
                .ToListAsync(cancellationToken);
    }
}
