namespace TestCraft.Domain.Entities;

public interface ISoftDeletableEntity
{
    bool IsDeleted { get; set; }
    DateTimeOffset? DeletedAt { get; set; }
}
