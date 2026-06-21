using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class GetTestCaseSteps
{
    public sealed record Query : IRequest<Paginated<TestCaseStepResponse>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid CaseId { get; init; }
        public int? Page { get; init; }
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
