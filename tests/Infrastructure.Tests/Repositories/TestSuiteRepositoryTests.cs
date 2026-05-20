using AwesomeAssertions;

using Domain.Entities;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class TestSuiteRepositoryTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    private static async Task<(AppDbContext db, Project project)> SeedProjectAsync()
    {
        var db = CreateContext();
        var project = new Project { Name = "Project" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        return (db, project);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsSuitesForProject()
    {
        var (db, project) = await SeedProjectAsync();
        var other = new Project { Name = "Other" };
        db.Projects.Add(other);
        db.TestSuites.AddRange(
            new TestSuite { ProjectId = project.Id, Name = "S1" },
            new TestSuite { ProjectId = project.Id, Name = "S2" },
            new TestSuite { ProjectId = other.Id, Name = "Other Suite" });
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.GetAllAsync(project.Id);

        result.Should().HaveCount(2).And.AllSatisfy(s => s.ProjectId.Should().Be(project.Id));
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedSuites()
    {
        var (db, project) = await SeedProjectAsync();
        var deleted = new TestSuite { ProjectId = project.Id, Name = "Deleted" };
        deleted.SoftDelete();
        db.TestSuites.AddRange(new TestSuite { ProjectId = project.Id, Name = "Active" }, deleted);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.GetAllAsync(project.Id);

        result.Should().HaveCount(1).And.ContainSingle(s => s.Name == "Active");
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A", Description = "desc" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.GetByIdAsync(project.Id, suite.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(suite.Id);
        result.Name.Should().Be("Suite A");
    }

    [Fact]
    public async Task GetByIdAsync_WhenWrongProject_ReturnsNull()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.GetByIdAsync(Guid.NewGuid(), suite.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExistsAsync_WhenExists_ReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.ExistsAsync(project.Id, suite.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WhenWrongProject_ReturnsFalse()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.ExistsAsync(Guid.NewGuid(), suite.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task AddAsync_PersistsSuiteAndReturnsDto()
    {
        var (db, project) = await SeedProjectAsync();
        var repo = new TestSuiteRepository(db);
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A", Description = "desc" };

        var result = await repo.AddAsync(suite);

        result.Name.Should().Be("Suite A");
        result.ProjectId.Should().Be(project.Id);
        db.TestSuites.Should().ContainSingle(s => s.Id == suite.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Old" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.UpdateAsync(project.Id, suite.Id, s => { s.Name = "New"; s.Description = "Updated"; });

        result.Should().BeTrue();
        var updated = await db.TestSuites.FindAsync(suite.Id);
        updated!.Name.Should().Be("New");
        updated.Description.Should().Be("Updated");
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var suite = new TestSuite { ProjectId = project.Id, Name = "Suite A" };
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.DeleteAsync(project.Id, suite.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync(project.Id);
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project) = await SeedProjectAsync();
        var repo = new TestSuiteRepository(db);

        var result = await repo.DeleteAsync(project.Id, Guid.NewGuid());

        result.Should().BeFalse();
    }
}