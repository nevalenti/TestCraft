using System.Collections.Concurrent;
using System.Linq.Expressions;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Events;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Events;
using TestCraft.Domain.ValueObjects;
using TestCraft.Persistence.Vogen;

namespace TestCraft.Persistence;

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
    public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        foreach (var idType in VogenGuidValueObjects.AllIn(typeof(ProjectId).Assembly))
        {
            configurationBuilder
                .Properties(idType)
                .HaveConversion(typeof(VogenGuidConverter<>).MakeGenericType(idType));
        }
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        var result = await base.SaveChangesAsync(cancellationToken);
        await DispatchDomainEventsAsync(cancellationToken);
        return result;
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

    private static readonly ConcurrentDictionary<
        Type,
        Func<IDomainEvent, INotification>
    > NotificationFactories = new();

    private async Task DispatchDomainEventsAsync(CancellationToken ct)
    {
        var entities = ChangeTracker
            .Entries<IHasDomainEvents>()
            .Select(entry => entry.Entity)
            .ToList();

        foreach (var entity in entities)
        {
            foreach (var domainEvent in entity.PopDomainEvents())
            {
                var factory = NotificationFactories.GetOrAdd(
                    domainEvent.GetType(),
                    CreateNotificationFactory
                );

                await publisher.Publish(factory(domainEvent), ct);
            }
        }
    }

    private static Func<IDomainEvent, INotification> CreateNotificationFactory(Type domainEventType)
    {
        var notificationType = typeof(DomainEventNotification<>).MakeGenericType(domainEventType);
        var constructor = notificationType.GetConstructors().Single();

        var parameter = Expression.Parameter(typeof(IDomainEvent), "domainEvent");
        var body = Expression.New(constructor, Expression.Convert(parameter, domainEventType));

        return Expression.Lambda<Func<IDomainEvent, INotification>>(body, parameter).Compile();
    }
}
