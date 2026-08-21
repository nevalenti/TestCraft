namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct ProjectId
{
    public static ProjectId New() => From(Guid.NewGuid());
}
