namespace TestCraft.Domain.Entities;

public abstract class SoftDeletableEntity : AuditableEntity, ISoftDeletableEntity
{
    public bool IsDeleted { get; private set; }
    public DateTimeOffset? DeletedAt { get; private set; }

    public void Delete(DateTimeOffset now)
    {
        IsDeleted = true;
        DeletedAt = now;
    }
}
