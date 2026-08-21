namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct WebhookSubscriptionId
{
    public static WebhookSubscriptionId New() => From(Guid.NewGuid());
}
