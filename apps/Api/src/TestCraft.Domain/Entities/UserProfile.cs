namespace TestCraft.Domain.Entities;

public class UserProfile : AuditableEntity
{
    /// <summary>The Keycloak subject id this profile belongs to - doubles as this entity's key.</summary>
    public UserId UserId { get; private set; }
    public string? AvatarKey { get; private set; }

    public static UserProfile Create(UserId userId, string? avatarKey = null) =>
        new() { UserId = userId, AvatarKey = avatarKey };

    public void SetAvatarKey(string avatarKey) => AvatarKey = avatarKey;
}
