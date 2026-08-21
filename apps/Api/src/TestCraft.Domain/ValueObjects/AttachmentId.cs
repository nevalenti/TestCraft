namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct AttachmentId
{
    public static AttachmentId New() => From(Guid.NewGuid());
}
