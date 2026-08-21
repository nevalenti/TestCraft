namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestCaseStepId
{
    public static TestCaseStepId New() => From(Guid.NewGuid());
}
