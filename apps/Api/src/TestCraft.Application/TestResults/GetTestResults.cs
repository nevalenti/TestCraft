using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestResults;

public static class GetTestResults
{
    public sealed record Query : IRequest<Paginated<TestResultResponse>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid RunId { get; init; }
        public TestResultStatus? Status { get; init; }
        public string? Search { get; init; }
        public int? Page { get; init; }
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
            var query = context.TestResults.Where(r => r.TestRunId == request.RunId);

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
