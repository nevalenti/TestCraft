namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct NoteId
{
    public static NoteId New() => From(Guid.NewGuid());
}
