namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct TestSectionId
{
    public static TestSectionId New() => From(Guid.NewGuid());
}
