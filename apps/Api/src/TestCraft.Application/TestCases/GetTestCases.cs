using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Labels;

namespace TestCraft.Application.TestCases;

public static class GetTestCases
{
    public sealed record Query : IRequest<Paginated<TestCaseResponse>>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid SuiteId { get; init; }
        public string? Search { get; init; }
        public Guid? LabelId { get; init; }
        public int? Page { get; init; }
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestCaseResponse>>
    {
        public async Task<Paginated<TestCaseResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestCases.Where(c => c.SuiteId == request.SuiteId);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(c => EF.Functions.ILike(c.Name, $"%{request.Search}%"));
            }

            if (request.LabelId.HasValue)
            {
                query = query.Where(c =>
                    c.TestCaseLabels.Any(tcl => tcl.LabelId == request.LabelId.Value)
                );
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(c => c.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(c => new TestCaseResponse
                {
                    Id = c.Id,
                    SuiteId = c.SuiteId,
                    Name = c.Name,
                    Description = c.Description,
                    Priority = c.Priority,
                    StepCount = c.Steps.Count(s => !s.IsDeleted),
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt,
                    Labels = c
                        .TestCaseLabels.Select(tcl => new LabelResponse
                        {
                            Id = tcl.Label!.Id,
                            Name = tcl.Label.Name,
                            Color = tcl.Label.Color,
                            ProjectId = tcl.Label.ProjectId,
                        })
                        .ToList(),
                })
                .ToListAsync(cancellationToken);

            return new Paginated<TestCaseResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}
