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
            var query = context.TestSuites.Where(suite => suite.ProjectId == request.ProjectId);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(suite => EF.Functions.ILike(suite.Name, $"%{request.Search}%"));
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderBy(suite => suite.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(suite => new TestSuiteResponse
                {
                    Id = suite.Id,
                    ProjectId = suite.ProjectId,
                    Name = suite.Name,
                    Description = suite.Description,
                    Source = suite.Source,
                    CreatedAt = suite.CreatedAt,
                    UpdatedAt = suite.UpdatedAt,
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
