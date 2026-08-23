namespace TestCraft.Domain.Entities;

public abstract class SoftDeletableEntity : AuditableEntity, ISoftDeletableEntity
{
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
