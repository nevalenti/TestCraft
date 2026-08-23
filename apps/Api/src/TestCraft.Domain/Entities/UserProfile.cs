namespace TestCraft.Domain.Entities;

public class UserProfile : AuditableEntity
{
    /// <summary>The Keycloak subject id this profile belongs to - doubles as this entity's key.</summary>
    public UserId UserId { get; set; }
    public string? AvatarKey { get; set; }
}
