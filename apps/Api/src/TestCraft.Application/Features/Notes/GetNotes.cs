using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Requests;

namespace TestCraft.Application.Features.Notes;

public static class GetNotes
{
    public enum SortField
    {
        Title,
        CreatedAt,
        UpdatedAt,
    }

    /// <summary>Lists notes in a scope; search matches the title.</summary>
    public sealed record Query : SearchPageQuery, IRequest<Paginated<NoteResponse>>
    {
        [RouteValue]
        public NoteScope Scope { get; init; } = null!;

        public SortField SortBy { get; init; } = SortField.UpdatedAt;

        public SortDirection SortDir { get; init; } = SortDirection.Desc;
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, Paginated<NoteResponse>>
    {
        public Task<Paginated<NoteResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var notes = request.Scope.Notes(context);

            notes = notes.WhereContainsIgnoringCase(note => note.Title, request.Search);

            var sorted = request.SortBy switch
            {
                SortField.Title => notes.SortedBy(
                    note => note.Title,
                    request.SortDir,
                    note => note.Id
                ),
                SortField.CreatedAt => notes.SortedBy(
                    note => note.CreatedAt,
                    request.SortDir,
                    note => note.Id
                ),
                _ => notes.SortedBy(note => note.UpdatedAt, request.SortDir, note => note.Id),
            };

            return sorted
                .Select(NoteResponse.Projection)
                .ToPaginatedAsync(request.ToPagination(), cancellationToken);
        }
    }
}
