namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestResultId
{
    public static TestResultId New() => From(Guid.NewGuid());
}
