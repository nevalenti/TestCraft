namespace TestCraft.Domain.Entities;

public interface ISoftDeletableEntity
{
    bool IsDeleted { get; }
    DateTimeOffset? DeletedAt { get; }
}
