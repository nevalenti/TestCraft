namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestCaseId
{
    public static TestCaseId New() => From(Guid.NewGuid());
}
