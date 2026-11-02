using System.Collections.Concurrent;
using System.Linq.Expressions;
using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Events;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Events;
using TestCraft.Domain.ValueObjects;
using TestCraft.Persistence.Vogen;

namespace TestCraft.Persistence;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    IPublisher publisher,
    TimeProvider timeProvider
) : DbContext(options), IApplicationDbContext
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
    public DbSet<IdempotencyRecord> IdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<Note> Notes => Set<Note>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.AddInboxStateEntity(inbox => inbox.ToTable("inbox_state"));
        modelBuilder.AddOutboxMessageEntity(message => message.ToTable("outbox_messages"));
        modelBuilder.AddOutboxStateEntity(outbox => outbox.ToTable("outbox_state"));
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
        await DispatchDomainEventsAsync(cancellationToken);
        ApplyAuditTimestamps();
        return await base.SaveChangesAsync(cancellationToken);
    }

    public Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken
    ) =>
        Database
            .CreateExecutionStrategy()
            .ExecuteAsync(
                async token =>
                {
                    await using var transaction = await Database.BeginTransactionAsync(token);
                    try
                    {
                        var result = await operation(token);
                        await transaction.CommitAsync(token);
                        return result;
                    }
                    catch
                    {
                        ChangeTracker.Clear();
                        throw;
                    }
                },
                cancellationToken
            );

    private void ApplyAuditTimestamps()
    {
        var now = timeProvider.GetStoredUtcNow();
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

        foreach (var entry in ChangeTracker.Entries<IVersioned>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.Version).CurrentValue++;
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
