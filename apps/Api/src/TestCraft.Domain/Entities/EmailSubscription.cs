using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class EmailSubscription : IVersioned
{
    public EmailSubscriptionId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public ProjectId ProjectId { get; private set; }
    public string Email { get; private set; } = null!;
    public string Events { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; }

    public Project? Project { get; }

    public static EmailSubscription Create(
        ProjectId projectId,
        string email,
        string events,
        DateTimeOffset now
    ) =>
        new()
        {
            Id = EmailSubscriptionId.New(),
            ProjectId = projectId,
            Email = Guard.AgainstEmpty(email, nameof(Email)),
            Events = Guard.AgainstEmpty(events, nameof(Events)),
            IsActive = true,
            CreatedAt = now,
        };

    public void Update(string email, string events, bool isActive)
    {
        Email = Guard.AgainstEmpty(email, nameof(Email));
        Events = Guard.AgainstEmpty(events, nameof(Events));
        IsActive = isActive;
    }
}
