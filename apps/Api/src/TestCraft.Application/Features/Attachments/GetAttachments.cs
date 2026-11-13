using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Attachments;

public static class GetAttachments
{
    public sealed record Query
        : PageQuery,
            IRequest<Paginated<AttachmentResponse>>,
            IProjectScopedRequest
    {
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        [RouteValue]
        public TestRunId RunId { get; init; }

        [RouteValue]
        public TestResultId ResultId { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<AttachmentResponse>>
    {
        public async Task<Paginated<AttachmentResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            await context
                .LiveResults()
                .EnsureExistsAsync(
                    result =>
                        result.Id == request.ResultId
                        && result.TestRunId == request.RunId
                        && result.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                );

            return await context
                .Attachments.Where(attachment => attachment.TestResultId == request.ResultId)
                .OrderBy(attachment => attachment.CreatedAt)
                .ThenBy(attachment => attachment.Id)
                .Select(attachment => new AttachmentResponse
                {
                    Id = attachment.Id,
                    TestResultId = attachment.TestResultId,
                    FileName = attachment.FileName,
                    ContentType = attachment.ContentType,
                    SizeBytes = attachment.SizeBytes,
                    CreatedAt = attachment.CreatedAt,
                })
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
