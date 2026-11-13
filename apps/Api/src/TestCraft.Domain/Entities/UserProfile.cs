namespace TestCraft.Domain.Entities;

public class UserProfile : AuditableEntity
{
    public UserId UserId { get; private set; }
    public string? AvatarKey { get; private set; }

    public static UserProfile Create(UserId userId, string? avatarKey = null) =>
        new() { UserId = userId, AvatarKey = avatarKey };

    public void SetAvatarKey(string avatarKey) => AvatarKey = avatarKey;
}
