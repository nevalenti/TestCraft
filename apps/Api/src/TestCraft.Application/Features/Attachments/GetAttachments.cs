using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Attachments;

public static class GetAttachments
{
    /// <summary>Lists the attachments on a test result, oldest first.</summary>
    public sealed record Query
        : PageQuery,
            IRequest<Paginated<AttachmentResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project the test result belongs to.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run the test result belongs to.</summary>
        [RouteValue]
        public TestRunId RunId { get; init; }

        /// <summary>The test result to list attachments for.</summary>
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
            var resultExists = await context
                .LiveResults()
                .AnyAsync(
                    result =>
                        result.Id == request.ResultId
                        && result.TestRunId == request.RunId
                        && result.TestRun!.ProjectId == request.ProjectId,
                    cancellationToken
                );
            if (!resultExists)
            {
                throw new NotFoundException();
            }

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
