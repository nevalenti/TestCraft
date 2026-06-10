using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Pagination;

namespace TestCraft.Application.TestCaseSteps.Queries.GetTestCaseSteps;

public record GetTestCaseStepsQuery
    : IRequest<Paginated<TestCaseStepResponse>>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required PaginationParams Pagination { get; init; }
}

public class GetTestCaseStepsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestCaseStepsQuery, Paginated<TestCaseStepResponse>>
{
    public async Task<Paginated<TestCaseStepResponse>> Handle(
        GetTestCaseStepsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.TestCaseSteps.Where(s =>
            s.TestCaseId == request.CaseId
        );

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.Order)
            .Skip(request.Pagination.Skip)
            .Take(request.Pagination.Take)
            .Select(TestCaseStepResponse.Projection)
            .ToListAsync(cancellationToken);

        return new Paginated<TestCaseStepResponse>
        {
            Items = items,
            Total = total,
            Page = request.Pagination.Page,
            PageSize = request.Pagination.PageSize,
        };
    }
}
