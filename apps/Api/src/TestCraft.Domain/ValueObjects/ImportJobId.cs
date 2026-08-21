namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct ImportJobId
{
    public static ImportJobId New() => From(Guid.NewGuid());
}
