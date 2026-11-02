using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Notes;

/// <summary>A note without its content, as lists return it.</summary>
public record NoteResponse
{
    public static readonly Expression<Func<Note, NoteResponse>> Projection =
        note => new NoteResponse
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
        };

    private static readonly Func<Note, NoteResponse> Map = Projection.Compile();

    public static NoteResponse FromEntity(Note note) => Map(note);

    /// <summary>The note's identifier.</summary>
    public required NoteId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The project the note belongs to; null for a personal note.</summary>
    public ProjectId? ProjectId { get; init; }

    /// <summary>The note's title.</summary>
    public required string Title { get; init; }

    /// <summary>The content's language, such as markdown, for highlighting.</summary>
    public required string Language { get; init; }

    /// <summary>The content's size in UTF-8 bytes.</summary>
    public required long SizeBytes { get; init; }

    /// <summary>Plain-text start of the content, up to 200 characters.</summary>
    public required string Excerpt { get; init; }

    /// <summary>When the note was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the note was last changed.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}

/// <summary>A note with its content.</summary>
public record NoteDetailResponse : NoteResponse
{
    /// <summary>The note's full content.</summary>
    public required string Content { get; init; }
}
