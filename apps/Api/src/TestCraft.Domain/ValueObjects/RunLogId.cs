namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct RunLogId
{
    public static RunLogId New() => From(Guid.NewGuid());
}
