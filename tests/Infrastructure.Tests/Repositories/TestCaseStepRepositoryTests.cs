using AwesomeAssertions;

using Domain.Entities;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class TestCaseStepRepositoryTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task<(AppDbContext db, Project project, TestSuite suite, TestCase testCase)> SeedCaseAsync()
    {
        var db = CreateContext();
        var project = new Project { Name = "Project" };
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite" };
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case" };
        db.Projects.Add(project);
        db.TestSuites.Add(suite);
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();

        return (db, project, suite, testCase);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsStepsOrderedByOrder()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        db.TestCaseSteps.AddRange(
            new TestCaseStep { TestCaseId = testCase.Id, Order = 3, Action = "Third", ExpectedResult = "r" },
            new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "First", ExpectedResult = "r" },
            new TestCaseStep { TestCaseId = testCase.Id, Order = 2, Action = "Second", ExpectedResult = "r" });
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = (await repo.GetAllAsync(project.Id, suite.Id, testCase.Id)).ToList();

        result.Should().HaveCount(3);
        result[0].Order.Should().Be(1);
        result[1].Order.Should().Be(2);
        result[2].Order.Should().Be(3);
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedSteps()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var deleted = new TestCaseStep { TestCaseId = testCase.Id, Order = 2, Action = "Deleted", ExpectedResult = "r" };
        deleted.SoftDelete();
        db.TestCaseSteps.AddRange(
            new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Active", ExpectedResult = "r" },
            deleted);
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.GetAllAsync(project.Id, suite.Id, testCase.Id);

        result.Should().HaveCount(1).And.ContainSingle(s => s.Action == "Active");
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var step = new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Click", ExpectedResult = "Opens" };
        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.GetByIdAsync(project.Id, suite.Id, testCase.Id, step.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(step.Id);
        result.Action.Should().Be("Click");
    }

    [Fact]
    public async Task GetByIdAsync_WhenWrongCase_ReturnsNull()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var step = new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Click", ExpectedResult = "Opens" };
        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.GetByIdAsync(project.Id, suite.Id, Guid.NewGuid(), step.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task AddAsync_PersistsStepAndReturnsDto()
    {
        var (db, _, _, testCase) = await SeedCaseAsync();
        var repo = new TestCaseStepRepository(db);
        var step = new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Click", ExpectedResult = "Opens" };

        var result = await repo.AddAsync(step);

        result.Order.Should().Be(1);
        result.Action.Should().Be("Click");
        result.ExpectedResult.Should().Be("Opens");
        db.TestCaseSteps.Should().ContainSingle(s => s.Id == step.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var step = new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Old", ExpectedResult = "Old" };
        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.UpdateAsync(project.Id, suite.Id, testCase.Id, step.Id,
            s => { s.Order = 2; s.Action = "New"; s.ExpectedResult = "New result"; });

        result.Should().BeTrue();
        var updated = await db.TestCaseSteps.FindAsync(step.Id);
        updated!.Order.Should().Be(2);
        updated.Action.Should().Be("New");
        updated.ExpectedResult.Should().Be("New result");
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var step = new TestCaseStep { TestCaseId = testCase.Id, Order = 1, Action = "Click", ExpectedResult = "Opens" };
        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.DeleteAsync(project.Id, suite.Id, testCase.Id, step.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync(project.Id, suite.Id, testCase.Id);
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project, suite, testCase) = await SeedCaseAsync();
        var repo = new TestCaseStepRepository(db);

        var result = await repo.DeleteAsync(project.Id, suite.Id, testCase.Id, Guid.NewGuid());

        result.Should().BeFalse();
    }
}