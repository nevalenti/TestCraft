using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;

namespace TestCraft.Application.Projects;

public static class GetProjects
{
    /// <summary>Lists the projects the current user owns or is a member of.</summary>
    public sealed record Query : IRequest<Paginated<ProjectResponse>>
    {
        /// <summary>Filters projects whose name contains this text.</summary>
        public string? Search { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of projects per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Query, Paginated<ProjectResponse>>
    {
        public async Task<Paginated<ProjectResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.Projects.Where(p =>
                p.UserId == currentUser.UserId || p.Members.Any(m => m.UserId == currentUser.UserId)
            );

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(p => EF.Functions.ILike(p.Name, $"%{request.Search}%"));
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    SuiteCount = p.TestSuites.Count(s => !s.IsDeleted),
                    RunCount = p.TestRuns.Count(r => !r.IsDeleted),
                    IsOwner = p.UserId == currentUser.UserId,
                })
                .ToListAsync(cancellationToken);

            return new Paginated<ProjectResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }
}
