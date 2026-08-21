namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct ShareTokenId
{
    public static ShareTokenId New() => From(Guid.NewGuid());
}
