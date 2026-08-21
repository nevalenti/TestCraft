namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct EmailSubscriptionId
{
    public static EmailSubscriptionId New() => From(Guid.NewGuid());
}
