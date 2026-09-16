using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class WebhookSubscription
{
    public WebhookSubscriptionId Id { get; private set; }
    public ProjectId ProjectId { get; private set; }
    public string Url { get; private set; } = null!;
    public string? Secret { get; private set; }
    public string Events { get; private set; } = null!;
    public bool IsActive { get; private set; } = true;
    public DateTimeOffset CreatedAt { get; private set; }

    public Project? Project { get; set; }

    public static WebhookSubscription Create(
        ProjectId projectId,
        string url,
        string? secret,
        string events
    ) =>
        new()
        {
            Id = WebhookSubscriptionId.New(),
            ProjectId = projectId,
            Url = Guard.AgainstEmpty(url, nameof(Url)),
            Secret = secret,
            Events = Guard.AgainstEmpty(events, nameof(Events)),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };

    public void Update(string url, string? secret, string events, bool isActive)
    {
        Url = Guard.AgainstEmpty(url, nameof(Url));
        Secret = secret;
        Events = Guard.AgainstEmpty(events, nameof(Events));
        IsActive = isActive;
    }
}
