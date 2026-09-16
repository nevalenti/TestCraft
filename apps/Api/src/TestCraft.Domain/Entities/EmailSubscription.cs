using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class EmailSubscription
{
    public EmailSubscriptionId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public string Email { get; private set; } = null!;
    public string Events { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; }

    public Project? Project { get; set; }

    public static EmailSubscription Create(ProjectId projectId, string email, string events) =>
        new()
        {
            Id = EmailSubscriptionId.New(),
            ProjectId = projectId,
            Email = Guard.AgainstEmpty(email, nameof(Email)),
            Events = Guard.AgainstEmpty(events, nameof(Events)),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };

    public void Update(string email, string events, bool isActive)
    {
        Email = Guard.AgainstEmpty(email, nameof(Email));
        Events = Guard.AgainstEmpty(events, nameof(Events));
        IsActive = isActive;
    }
}
