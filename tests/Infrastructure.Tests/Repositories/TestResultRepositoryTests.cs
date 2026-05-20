using AwesomeAssertions;

using Domain.Entities;
using Domain.Enums;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class TestResultRepositoryTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task<(AppDbContext db, Project project, TestRun run, TestCase testCase)> SeedAsync()
    {
        var db = CreateContext();
        var project = new Project { Name = "Project" };
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite" };
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case" };
        var run = new TestRun { ProjectId = project.Id, Name = "Run", Environment = "Staging" };
        db.Projects.Add(project);
        db.TestSuites.Add(suite);
        db.TestCases.Add(testCase);
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();

        return (db, project, run, testCase);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsResultsForRun()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var otherRun = new TestRun { ProjectId = project.Id, Name = "Other", Environment = "Prod" };
        db.TestRuns.Add(otherRun);
        db.TestResults.AddRange(
            new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow },
            new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Failed, ExecutedAt = DateTime.UtcNow },
            new TestResult { TestRunId = otherRun.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.GetAllAsync(project.Id, run.Id);

        result.Should().HaveCount(2).And.AllSatisfy(r => r.TestRunId.Should().Be(run.Id));
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedResults()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var deleted = new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow };
        deleted.SoftDelete();
        db.TestResults.AddRange(
            new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Failed, ExecutedAt = DateTime.UtcNow },
            deleted);
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.GetAllAsync(project.Id, run.Id);

        result.Should().HaveCount(1).And.ContainSingle(r => r.Status == TestResultStatus.Failed);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var testResult = new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, Notes = "ok", ExecutedAt = DateTime.UtcNow };
        db.TestResults.Add(testResult);
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.GetByIdAsync(project.Id, run.Id, testResult.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(testResult.Id);
        result.Status.Should().Be(TestResultStatus.Passed);
        result.Notes.Should().Be("ok");
    }

    [Fact]
    public async Task GetByIdAsync_WhenWrongRun_ReturnsNull()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var testResult = new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow };
        db.TestResults.Add(testResult);
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.GetByIdAsync(project.Id, Guid.NewGuid(), testResult.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task AddAsync_PersistsResultAndReturnsDto()
    {
        var (db, _, run, testCase) = await SeedAsync();
        var repo = new TestResultRepository(db);
        var executedAt = DateTime.UtcNow;
        var testResult = new TestResult
        {
            TestRunId = run.Id,
            TestCaseId = testCase.Id,
            Status = TestResultStatus.Failed,
            Notes = "Regression",
            ExecutedAt = executedAt
        };

        var result = await repo.AddAsync(testResult);

        result.Status.Should().Be(TestResultStatus.Failed);
        result.Notes.Should().Be("Regression");
        result.TestRunId.Should().Be(run.Id);
        result.TestCaseId.Should().Be(testCase.Id);
        db.TestResults.Should().ContainSingle(r => r.Id == testResult.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var testResult = new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow };
        db.TestResults.Add(testResult);
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.UpdateAsync(project.Id, run.Id, testResult.Id,
            r => { r.Status = TestResultStatus.Blocked; r.Notes = "Env down"; });

        result.Should().BeTrue();
        var updated = await db.TestResults.FindAsync(testResult.Id);
        updated!.Status.Should().Be(TestResultStatus.Blocked);
        updated.Notes.Should().Be("Env down");
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project, run, _) = await SeedAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.UpdateAsync(project.Id, run.Id, Guid.NewGuid(), r => r.Notes = "x");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        var (db, project, run, testCase) = await SeedAsync();
        var testResult = new TestResult { TestRunId = run.Id, TestCaseId = testCase.Id, Status = TestResultStatus.Passed, ExecutedAt = DateTime.UtcNow };
        db.TestResults.Add(testResult);
        await db.SaveChangesAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.DeleteAsync(project.Id, run.Id, testResult.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync(project.Id, run.Id);
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project, run, _) = await SeedAsync();
        var repo = new TestResultRepository(db);

        var result = await repo.DeleteAsync(project.Id, run.Id, Guid.NewGuid());

        result.Should().BeFalse();
    }
}