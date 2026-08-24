namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct NotificationDeliveryId
{
    public static NotificationDeliveryId New() => From(Guid.NewGuid());
}
