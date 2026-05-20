using AwesomeAssertions;

using Domain.Entities;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class TestCaseRepositoryTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task<(AppDbContext db, Project project, TestSuite suite)> SeedSuiteAsync()
    {
        var db = CreateContext();
        var project = new Project { Name = "Project" };
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite" };
        db.Projects.Add(project);
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();

        return (db, project, suite);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCasesForSuite()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var otherSuite = new TestSuite { ProjectId = project.Id, Name = "Other" };
        db.TestSuites.Add(otherSuite);
        db.TestCases.AddRange(
            new TestCase { SuiteId = suite.Id, Name = "Case A" },
            new TestCase { SuiteId = suite.Id, Name = "Case B" },
            new TestCase { SuiteId = otherSuite.Id, Name = "Other Case" });
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.GetAllAsync(project.Id, suite.Id);

        result.Should().HaveCount(2).And.AllSatisfy(c => c.SuiteId.Should().Be(suite.Id));
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedCases()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var deleted = new TestCase { SuiteId = suite.Id, Name = "Deleted" };
        deleted.SoftDelete();
        db.TestCases.AddRange(new TestCase { SuiteId = suite.Id, Name = "Active" }, deleted);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.GetAllAsync(project.Id, suite.Id);

        result.Should().HaveCount(1).And.ContainSingle(c => c.Name == "Active");
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A", Description = "desc" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.GetByIdAsync(project.Id, suite.Id, testCase.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(testCase.Id);
        result.Name.Should().Be("Case A");
    }

    [Fact]
    public async Task GetByIdAsync_WhenWrongSuite_ReturnsNull()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.GetByIdAsync(project.Id, Guid.NewGuid(), testCase.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExistsAsync_WhenExists_ReturnsTrue()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.ExistsAsync(project.Id, suite.Id, testCase.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsInProjectAsync_WhenExistsInProject_ReturnsTrue()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.ExistsInProjectAsync(project.Id, testCase.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsInProjectAsync_WhenWrongProject_ReturnsFalse()
    {
        var (db, _, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.ExistsInProjectAsync(Guid.NewGuid(), testCase.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task AddAsync_PersistsCaseAndReturnsDto()
    {
        var (db, _, suite) = await SeedSuiteAsync();
        var repo = new TestCaseRepository(db);
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A", Description = "desc" };

        var result = await repo.AddAsync(testCase);

        result.Name.Should().Be("Case A");
        result.SuiteId.Should().Be(suite.Id);
        db.TestCases.Should().ContainSingle(c => c.Id == testCase.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Old" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.UpdateAsync(project.Id, suite.Id, testCase.Id, c => { c.Name = "New"; c.Description = "Updated"; });

        result.Should().BeTrue();
        var updated = await db.TestCases.FindAsync(testCase.Id);
        updated!.Name.Should().Be("New");
        updated.Description.Should().Be("Updated");
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var testCase = new TestCase { SuiteId = suite.Id, Name = "Case A" };
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.DeleteAsync(project.Id, suite.Id, testCase.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync(project.Id, suite.Id);
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project, suite) = await SeedSuiteAsync();
        var repo = new TestCaseRepository(db);

        var result = await repo.DeleteAsync(project.Id, suite.Id, Guid.NewGuid());

        result.Should().BeFalse();
    }
}