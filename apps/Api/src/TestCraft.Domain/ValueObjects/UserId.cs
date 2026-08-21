namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct UserId
{
    public static UserId New() => From(Guid.NewGuid());
}
