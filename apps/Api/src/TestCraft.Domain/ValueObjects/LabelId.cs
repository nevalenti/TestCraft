namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct LabelId
{
    public static LabelId New() => From(Guid.NewGuid());
}
