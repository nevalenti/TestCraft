namespace TestCraft.Domain.Entities;

public class Project : IAuditableEntity, ISoftDeletableEntity
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<TestSuite> TestSuites { get; set; } = [];
    public ICollection<TestRun> TestRuns { get; set; } = [];
    public ICollection<Label> Labels { get; set; } = [];
    public ICollection<TestPlan> TestPlans { get; set; } = [];
    public ICollection<ApiToken> ApiTokens { get; set; } = [];
    public ICollection<WebhookSubscription> WebhookSubscriptions { get; set; } = [];
    public ICollection<EmailSubscription> EmailSubscriptions { get; set; } = [];
    public ICollection<ProjectMember> Members { get; set; } = [];
}
