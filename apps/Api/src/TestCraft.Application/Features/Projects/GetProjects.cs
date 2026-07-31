using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;

namespace TestCraft.Application.Features.Projects;

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
            var query = context.Projects.Where(project =>
                project.UserId == currentUser.UserId
                || project.Members.Any(member => member.UserId == currentUser.UserId)
            );

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(project =>
                    EF.Functions.ILike(project.Name, $"%{request.Search}%")
                );
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(project => project.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(project => new ProjectResponse
                {
                    Id = project.Id,
                    Name = project.Name,
                    Description = project.Description,
                    CreatedAt = project.CreatedAt,
                    UpdatedAt = project.UpdatedAt,
                    SuiteCount = project.TestSuites.Count(suite => !suite.IsDeleted),
                    RunCount = project.TestRuns.Count(run => !run.IsDeleted),
                    IsOwner = project.UserId == currentUser.UserId,
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
