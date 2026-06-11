using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Pagination;

namespace TestCraft.Application.Projects.Queries.GetProjects;

public record GetProjectsQuery : IRequest<Paginated<ProjectResponse>>
{
    public string? Search { get; init; }
    public required PaginationParams Pagination { get; init; }
}

public class GetProjectsQueryHandler(IApplicationDbContext context, ICurrentUser currentUser)
    : IRequestHandler<GetProjectsQuery, Paginated<ProjectResponse>>
{
    public async Task<Paginated<ProjectResponse>> Handle(
        GetProjectsQuery request,
        CancellationToken cancellationToken
    )
    {
        var query = context.Projects.Where(p => p.UserId == currentUser.UserId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(p => EF.Functions.ILike(p.Name, $"%{request.Search}%"));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(request.Pagination.Skip)
            .Take(request.Pagination.Take)
            .Select(ProjectResponse.Projection)
            .ToListAsync(cancellationToken);

        return new Paginated<ProjectResponse>
        {
            Items = items,
            Total = total,
            Page = request.Pagination.Page,
            PageSize = request.Pagination.PageSize,
        };
    }
}
