using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestResults;

public static class GetTestResults
{
    /// <summary>Lists the test results within a run.</summary>
    public sealed record Query : IRequest<Paginated<TestResultResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run to list results for.</summary>
        public Guid RunId { get; init; }

        /// <summary>Filters results to this status.</summary>
        public TestResultStatus? Status { get; init; }

        /// <summary>Filters results whose test case name contains this text.</summary>
        public string? Search { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of results per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestResultResponse>>
    {
        public async Task<Paginated<TestResultResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestResults.Where(r =>
                r.TestRunId == request.RunId && r.TestRun!.ProjectId == request.ProjectId
            );

            if (request.Status is not null)
            {
                query = query.Where(r => r.Status == request.Status);
            }

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(r =>
                    EF.Functions.ILike(r.TestCase!.Name, $"%{request.Search}%")
                );
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(r => r.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(r => new TestResultResponse
                {
                    Id = r.Id,
                    TestRunId = r.TestRunId,
                    TestCaseId = r.TestCaseId,
                    SuiteId = r.TestCase!.SuiteId,
                    TestCaseName = r.TestCase.Name,
                    Status = r.Status,
                    Notes = r.Notes,
                    DurationMs = r.DurationMs,
                    DefectType = r.DefectType,
                    ExecutedAt = r.ExecutedAt,
                    ExecutedById = r.ExecutedById,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                })
                .ToListAsync(cancellationToken);

            return new Paginated<TestResultResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}
