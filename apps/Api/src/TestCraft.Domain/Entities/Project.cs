using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class Project : SoftDeletableEntity, IVersioned
{
    public ProjectId Id { get; private set; }
    public int Version { get; private set; } = 1;
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public UserId UserId { get; private set; }

    public ICollection<TestSuite> TestSuites { get; } = [];
    public ICollection<TestRun> TestRuns { get; } = [];
    public ICollection<Label> Labels { get; } = [];
    public ICollection<TestPlan> TestPlans { get; } = [];
    public ICollection<ApiToken> ApiTokens { get; } = [];
    public ICollection<WebhookSubscription> WebhookSubscriptions { get; } = [];
    public ICollection<EmailSubscription> EmailSubscriptions { get; } = [];
    public ICollection<ProjectMember> Members { get; } = [];
    public ICollection<NotificationDelivery> NotificationDeliveries { get; } = [];

    public static Project Create(string name, string? description, UserId ownerId) =>
        new()
        {
            Id = ProjectId.New(),
            Name = Guard.AgainstEmpty(name, nameof(Name)),
            Description = description,
            UserId = ownerId,
        };

    public void Update(string name, string? description)
    {
        Name = Guard.AgainstEmpty(name, nameof(Name));
        Description = description;
    }
}
