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
    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
