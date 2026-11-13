using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

public static class DeleteNote
{
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
            var note = await request
                .Scope.Notes(context)
                .FirstOrNotFoundAsync(note => note.Id == request.Id, cancellationToken);

            note.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
            await storage.DeleteReplacedAsync(note.StorageKey, logger);
        }
    }
}
