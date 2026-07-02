using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Events;

namespace TestCraft.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options, IPublisher publisher)
    : DbContext(options),
        IApplicationDbContext
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TestSuite> TestSuites => Set<TestSuite>();
    public DbSet<TestCase> TestCases => Set<TestCase>();
    public DbSet<TestCaseStep> TestCaseSteps => Set<TestCaseStep>();
    public DbSet<TestRun> TestRuns => Set<TestRun>();
    public DbSet<TestResult> TestResults => Set<TestResult>();
    public DbSet<ImportJob> ImportJobs => Set<ImportJob>();
    public DbSet<Label> Labels => Set<Label>();
    public DbSet<TestCaseLabel> TestCaseLabels => Set<TestCaseLabel>();
    public DbSet<TestPlan> TestPlans => Set<TestPlan>();
    public DbSet<TestPlanCase> TestPlanCases => Set<TestPlanCase>();
    public DbSet<ApiToken> ApiTokens => Set<ApiToken>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<ShareToken> ShareTokens => Set<ShareToken>();
    public DbSet<WebhookSubscription> WebhookSubscriptions => Set<WebhookSubscription>();
    public DbSet<EmailSubscription> EmailSubscriptions => Set<EmailSubscription>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<RunLog> RunLogs => Set<RunLog>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        var result = await base.SaveChangesAsync(cancellationToken);
        await DispatchDomainEventsAsync(cancellationToken);
        return result;
    }

    public override int SaveChanges()
    {
        ApplyAuditTimestamps();
        return base.SaveChanges();
    }

    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<IAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    break;
            }
        }
    }

    private async Task DispatchDomainEventsAsync(CancellationToken ct)
    {
        var entities = ChangeTracker.Entries<IHasDomainEvents>().Select(e => e.Entity).ToList();

        foreach (var entity in entities)
        {
            foreach (var domainEvent in entity.PopDomainEvents())
            {
                await publisher.Publish(domainEvent, ct);
            }
        }
    }
}
