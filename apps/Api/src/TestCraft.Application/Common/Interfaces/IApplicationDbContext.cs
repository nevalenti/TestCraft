using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Project> Projects { get; }
    DbSet<TestSuite> TestSuites { get; }
    DbSet<TestCase> TestCases { get; }
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
    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
