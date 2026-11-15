using Microsoft.EntityFrameworkCore;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Project> Projects { get; }
    DbSet<TestSuite> TestSuites { get; }
    DbSet<TestCase> TestCases { get; }
    DbSet<TestSection> TestSections { get; }
    DbSet<TestCaseStep> TestCaseSteps { get; }
    DbSet<TestRun> TestRuns { get; }
    DbSet<TestResult> TestResults { get; }
    DbSet<ImportJob> ImportJobs { get; }
    DbSet<Label> Labels { get; }
    DbSet<TestCaseLabel> TestCaseLabels { get; }
    DbSet<TestPlan> TestPlans { get; }
    DbSet<TestPlanCase> TestPlanCases { get; }
    DbSet<ApiToken> ApiTokens { get; }
    DbSet<Attachment> Attachments { get; }
    DbSet<ShareToken> ShareTokens { get; }
    DbSet<WebhookSubscription> WebhookSubscriptions { get; }
    DbSet<EmailSubscription> EmailSubscriptions { get; }
    DbSet<UserProfile> UserProfiles { get; }
    DbSet<RunLog> RunLogs { get; }
    DbSet<ProjectMember> ProjectMembers { get; }
    DbSet<NotificationDelivery> NotificationDeliveries { get; }
    DbSet<Note> Notes { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>Locks the suite row until the current transaction ends, serializing changes to its section tree.</summary>
    Task LockSuiteAsync(TestSuiteId suiteId, CancellationToken cancellationToken);

    Task<T> ExecuteInTransactionAsync<T>(
        Func<CancellationToken, Task<T>> operation,
        CancellationToken cancellationToken
    );
}
