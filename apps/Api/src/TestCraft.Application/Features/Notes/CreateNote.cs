using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Notes;

public static class CreateNote
{
    /// <summary>Creates a note.</summary>
    public sealed record Command : IRequest<NoteResponse>
    {
        [JsonIgnore]
        public NoteScope Scope { get; init; } = null!;

        /// <summary>The note's title, one line.</summary>
        public required string Title { get; init; }

        /// <summary>The content's language, such as markdown.</summary>
        public string Language { get; init; } = "markdown";

        /// <summary>The note's content, up to 1,000,000 characters.</summary>
        public string Content { get; init; } = "";
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
        ICurrentUser currentUser,
        IStorageService storage
    ) : IRequestHandler<Command, NoteResponse>
    {
        public async Task<NoteResponse> Handle(Command request, CancellationToken cancellationToken)
        {
            var key = await NoteContent.StoreAsync(
                storage,
                request.Scope,
                request.Content,
                cancellationToken
            );

            var note = Note.Create(
                request.Scope.ProjectId,
                currentUser.UserId,
                request.Title,
                request.Language,
                key,
                request.Content
            );
            context.Notes.Add(note);

            await NoteContent.SaveOrDiscardAsync(context, storage, key, cancellationToken);

            return NoteResponse.FromEntity(note);
        }
    }
}
