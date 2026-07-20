namespace TestCraft.Domain.Entities;

public class UserProfile : IAuditableEntity
{
    /// <summary>The Keycloak subject id this profile belongs to - doubles as this entity's key.</summary>
    public Guid UserId { get; set; }
    public string? AvatarKey { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
