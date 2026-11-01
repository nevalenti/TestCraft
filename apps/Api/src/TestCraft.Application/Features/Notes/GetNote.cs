using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

public static class GetNote
{
    /// <summary>Gets a note with its content.</summary>
    public sealed record Query : IRequest<NoteDetailResponse>
    {
        public required NoteScope Scope { get; init; }

        public required NoteId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, IStorageService storage)
        : IRequestHandler<Query, NoteDetailResponse>
    {
        public async Task<NoteDetailResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var note =
                await request
                    .Scope.Notes(context)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(note => note.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException();

            var content = await storage.DownloadAsync(note.StorageKey, cancellationToken);

            return new NoteDetailResponse
            {
                Id = note.Id,
                Version = note.Version,
                ProjectId = note.ProjectId,
                Title = note.Title,
                Language = note.Language,
                SizeBytes = note.SizeBytes,
                Excerpt = note.Excerpt,
                CreatedAt = note.CreatedAt,
                UpdatedAt = note.UpdatedAt,
                Content = Encoding.UTF8.GetString(content),
            };
        }
    }
}
