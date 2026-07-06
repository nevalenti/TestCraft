using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class GetTestCaseSteps
{
    /// <summary>Lists the steps of a test case, in order.</summary>
    public sealed record Query : IRequest<Paginated<TestCaseStepResponse>>, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The test case to list steps for.</summary>
        public Guid CaseId { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of steps per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseStepResponse>>
    {
        public async Task<Paginated<TestCaseStepResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestCaseSteps.Where(s => s.TestCaseId == request.CaseId);

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(s => s.Order)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(s => new TestCaseStepResponse
                {
                    Id = s.Id,
                    TestCaseId = s.TestCaseId,
                    Order = s.Order,
                    Action = s.Action,
                    ExpectedResult = s.ExpectedResult,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                })
                .ToListAsync(cancellationToken);

            return new Paginated<TestCaseStepResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}
