namespace TestCraft.Domain.ValueObjects;

[ValueObject<Guid>]
public readonly partial struct ProjectMemberId
{
    public static ProjectMemberId New() => From(Guid.NewGuid());
}
