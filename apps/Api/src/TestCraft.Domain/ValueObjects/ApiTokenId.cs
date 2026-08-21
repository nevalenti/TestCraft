namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct ApiTokenId
{
    public static ApiTokenId New() => From(Guid.NewGuid());
}
