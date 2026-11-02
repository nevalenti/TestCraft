using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;

namespace TestCraft.Application.Features.Projects;

public static class GetProjects
{
    public enum SortField
    {
        Name,
        CreatedAt,
    }

    /// <summary>Lists the projects the current user owns or is a member of; search matches the name.</summary>
    public sealed record Query : SearchPageQuery, IRequest<Paginated<ProjectResponse>>
    {
        public SortField SortBy { get; init; } = SortField.CreatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Desc;
    }

    public sealed class Handler(IApplicationDbContext context, ICurrentUser currentUser)
        : IRequestHandler<Query, Paginated<ProjectResponse>>
    {
        public async Task<Paginated<ProjectResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var userId = currentUser.UserId;
            var query = context.Projects.Where(project =>
                project.UserId == userId || project.Members.Any(member => member.UserId == userId)
            );

            query = query.WhereContainsIgnoringCase(project => project.Name, request.Search);

            var sorted =
                request.SortBy == SortField.Name
                    ? query.SortedBy(
                        project => project.Name,
                        request.SortDir,
                        project => project.Id
                    )
                    : query.SortedBy(
                        project => project.CreatedAt,
                        request.SortDir,
                        project => project.Id
                    );

            var page = await sorted
                .Select(ProjectResponse.For(userId))
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);

            return page with
            {
                Items = await page.Items.WithRecentPassRatesAsync(context, cancellationToken),
            };
        }
    }
}
