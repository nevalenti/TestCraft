using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites;

public static class GetTestSuites
{
    /// <summary>Lists the test suites in a project.</summary>
    public sealed record Query : IRequest<Paginated<TestSuiteResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list suites for.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>Filters suites whose name contains this text.</summary>
        public string? Search { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of suites per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<TestSuiteResponse>>
    {
        public async Task<Paginated<TestSuiteResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestSuites.Where(s => s.ProjectId == request.ProjectId);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(s => EF.Functions.ILike(s.Name, $"%{request.Search}%"));
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(s => s.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(s => new TestSuiteResponse
                {
                    Id = s.Id,
                    ProjectId = s.ProjectId,
                    Name = s.Name,
                    Description = s.Description,
                    Source = s.Source,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                })
                .ToListAsync(cancellationToken);

            return new Paginated<TestSuiteResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}
