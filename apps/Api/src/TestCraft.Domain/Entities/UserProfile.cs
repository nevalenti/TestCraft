namespace TestCraft.Domain.Entities;

public class UserProfile
{
    public Guid UserId { get; set; }
    public string? AvatarKey { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
