using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.Labels;

public static class GetLabels
{
    public enum SortField
    {
        Name,
        CreatedAt,
    }

    /// <summary>Lists the labels defined in a project; search matches the label name.</summary>
    public sealed record Query
        : SearchPageQuery,
            IRequest<Paginated<LabelResponse>>,
            IProjectScopedRequest
    {
        /// <summary>The project to list labels for.</summary>
        [RouteValue]
        public ProjectId ProjectId { get; init; }

        public SortField SortBy { get; init; } = SortField.Name;

        public SortDirection SortDir { get; init; } = SortDirection.Asc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<LabelResponse>>
    {
        public Task<Paginated<LabelResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.Labels.Where(label => label.ProjectId == request.ProjectId);

            query = query.WhereContainsIgnoringCase(label => label.Name, request.Search);

            var sorted =
                request.SortBy == SortField.CreatedAt
                    ? query.SortedBy(label => label.CreatedAt, request.SortDir, label => label.Id)
                    : query.SortedBy(label => label.Name, request.SortDir, label => label.Id);

            return sorted
                .Select(LabelResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
