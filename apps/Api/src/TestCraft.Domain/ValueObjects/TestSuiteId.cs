namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestSuiteId
{
    public static TestSuiteId New() => From(Guid.NewGuid());
}
