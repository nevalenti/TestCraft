using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

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
            var query = context.TestCaseSteps.Where(step => step.TestCaseId == request.CaseId);

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(step => step.Order)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(step => new TestCaseStepResponse
                {
                    Id = step.Id,
                    TestCaseId = step.TestCaseId,
                    Order = step.Order,
                    Action = step.Action,
                    ExpectedResult = step.ExpectedResult,
                    CreatedAt = step.CreatedAt,
                    UpdatedAt = step.UpdatedAt,
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
