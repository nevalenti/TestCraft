using System.Text;
using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class Note : SoftDeletableEntity, IVersioned
{
    public NoteId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public ProjectId? ProjectId { get; private set; }
    public UserId OwnerId { get; private set; }
    public string Title { get; private set; } = null!;
    public string Language { get; private set; } = null!;
    public string StorageKey { get; private set; } = null!;
    public long SizeBytes { get; private set; }
    public string Excerpt { get; private set; } = "";

    public Project? Project { get; }

    public static Note Create(
        ProjectId? projectId,
        UserId ownerId,
        string title,
        string language,
        string storageKey,
        string content
    )
    {
        var note = new Note
        {
            Id = NoteId.New(),
            ProjectId = projectId,
            OwnerId = ownerId,
        };
        note.Replace(title, language, storageKey, content);

        return note;
    }

    public void Replace(string title, string language, string storageKey, string content)
    {
        Title = Guard.AgainstEmpty(title, nameof(Title));
        Language = Guard.AgainstEmpty(language, nameof(Language));
        StorageKey = Guard.AgainstEmpty(storageKey, nameof(StorageKey));
        SizeBytes = Encoding.UTF8.GetByteCount(content);
        Excerpt = NoteExcerpt.Build(content, language);
    }
}
