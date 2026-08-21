using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

public static class GetTestResults
{
    /// <summary>Lists the test results within a run.</summary>
    public sealed record Query : IRequest<Paginated<TestResultResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to list results for.</summary>
        public TestRunId RunId { get; init; }

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
            var query = context.TestResults.Where(result =>
                result.TestRunId == request.RunId && result.TestRun!.ProjectId == request.ProjectId
            );

            if (request.Status is not null)
            {
                query = query.Where(result => result.Status == request.Status);
            }

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(result =>
                    EF.Functions.ILike(result.TestCase!.Name, $"%{request.Search}%")
                );
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(result => result.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(result => new TestResultResponse
                {
                    Id = result.Id,
                    TestRunId = result.TestRunId,
                    TestCaseId = result.TestCaseId,
                    SuiteId = result.TestCase!.SuiteId,
                    TestCaseName = result.TestCase.Name,
                    Status = result.Status,
                    Notes = result.Notes,
                    DurationMs = result.DurationMs,
                    DefectType = result.DefectType,
                    ExecutedAt = result.ExecutedAt,
                    ExecutedById = result.ExecutedById,
                    CreatedAt = result.CreatedAt,
                    UpdatedAt = result.UpdatedAt,
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
