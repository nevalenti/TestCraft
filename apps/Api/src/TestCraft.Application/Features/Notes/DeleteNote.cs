using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

public static class DeleteNote
{
    /// <summary>Deletes a note and its stored content.</summary>
    public sealed record Command : IRequest
    {
        public required NoteScope Scope { get; init; }

        public required NoteId Id { get; init; }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IStorageService storage,
        ILogger<Handler> logger,
        TimeProvider timeProvider
    ) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var note =
                await request
                    .Scope.Notes(context)
                    .FirstOrDefaultAsync(note => note.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException();

            note.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
            await NoteContent.DeleteReplacedAsync(storage, note.StorageKey, logger);
        }
    }
}
