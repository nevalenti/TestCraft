using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class WebhookSubscription : IVersioned
{
    public WebhookSubscriptionId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public ProjectId ProjectId { get; private set; }
    public string Url { get; private set; } = null!;
    public string? Secret { get; private set; }
    public string Events { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; }

    public Project? Project { get; }

    public static WebhookSubscription Create(
        ProjectId projectId,
        string url,
        string? secret,
        string events,
        DateTimeOffset now
    ) =>
        new()
        {
            Id = WebhookSubscriptionId.New(),
            ProjectId = projectId,
            Url = Guard.AgainstEmpty(url, nameof(Url)),
            Secret = secret,
            Events = Guard.AgainstEmpty(events, nameof(Events)),
            IsActive = true,
            CreatedAt = now,
        };

    public void Update(string url, string? secret, string events, bool isActive)
    {
        Url = Guard.AgainstEmpty(url, nameof(Url));
        Secret = secret;
        Events = Guard.AgainstEmpty(events, nameof(Events));
        IsActive = isActive;
    }
}
