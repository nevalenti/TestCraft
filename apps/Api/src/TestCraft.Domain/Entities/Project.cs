using TestCraft.Domain.Common;

namespace TestCraft.Domain.Entities;

public class Project : SoftDeletableEntity
{
    public ProjectId Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public UserId UserId { get; private set; }

    public ICollection<TestSuite> TestSuites { get; set; } = [];
    public ICollection<TestRun> TestRuns { get; set; } = [];
    public ICollection<Label> Labels { get; set; } = [];
    public ICollection<TestPlan> TestPlans { get; set; } = [];
    public ICollection<ApiToken> ApiTokens { get; set; } = [];
    public ICollection<WebhookSubscription> WebhookSubscriptions { get; set; } = [];
    public ICollection<EmailSubscription> EmailSubscriptions { get; set; } = [];
    public ICollection<ProjectMember> Members { get; set; } = [];
    public ICollection<NotificationDelivery> NotificationDeliveries { get; set; } = [];

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
