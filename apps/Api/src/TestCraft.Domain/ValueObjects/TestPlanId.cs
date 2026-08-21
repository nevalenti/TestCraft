namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestPlanId
{
    public static TestPlanId New() => From(Guid.NewGuid());
}
