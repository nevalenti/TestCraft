namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestRunId
{
    public static TestRunId New() => From(Guid.NewGuid());
}
