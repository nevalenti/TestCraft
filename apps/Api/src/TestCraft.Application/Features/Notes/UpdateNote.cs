using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.Notes;

public static class UpdateNote
{
    /// <summary>Replaces a note's title, language and content.</summary>
    public sealed record Command : IRequest<NoteResponse>
    {
        [JsonIgnore]
        public NoteScope Scope { get; init; } = null!;

        [JsonIgnore]
        public NoteId Id { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }

        /// <summary>The note's title, one line.</summary>
        public required string Title { get; init; }

        /// <summary>The content's language, such as markdown.</summary>
        public required string Language { get; init; }

        /// <summary>The note's content, up to 1,000,000 characters.</summary>
        public required string Content { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            NoteRules.Title(RuleFor(command => command.Title));
            NoteRules.Language(RuleFor(command => command.Language));
            NoteRules.Content(RuleFor(command => command.Content));
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IStorageService storage,
        ILogger<Handler> logger
    ) : IRequestHandler<Command, NoteResponse>
    {
        public async Task<NoteResponse> Handle(Command request, CancellationToken cancellationToken)
        {
            var note =
                await request
                    .Scope.Notes(context)
                    .FirstOrDefaultAsync(note => note.Id == request.Id, cancellationToken)
                ?? throw new NotFoundException();

            VersionCheck.Ensure(note, request.ExpectedVersion);

            var previousKey = note.StorageKey;
            var key = await NoteContent.StoreAsync(
                storage,
                request.Scope,
                request.Content,
                cancellationToken
            );
            note.Replace(request.Title, request.Language, key, request.Content);

            await NoteContent.SaveOrDiscardAsync(context, storage, key, cancellationToken);
            await NoteContent.DeleteReplacedAsync(storage, previousKey, logger);

            return NoteResponse.FromEntity(note);
        }
    }
}
