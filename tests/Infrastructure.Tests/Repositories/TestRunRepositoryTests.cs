using AwesomeAssertions;

using Domain.Entities;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class TestRunRepositoryTests
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
    public async Task GetAllAsync_ReturnsRunsForProject()
    {
        var (db, project) = await SeedProjectAsync();
        var other = new Project { Name = "Other" };
        db.Projects.Add(other);
        db.TestRuns.AddRange(
            new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" },
            new TestRun { ProjectId = project.Id, Name = "Run 2", Environment = "Prod" },
            new TestRun { ProjectId = other.Id, Name = "Other Run", Environment = "Dev" });
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.GetAllAsync(project.Id);

        result.Should().HaveCount(2).And.AllSatisfy(r => r.ProjectId.Should().Be(project.Id));
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedRuns()
    {
        var (db, project) = await SeedProjectAsync();
        var deleted = new TestRun { ProjectId = project.Id, Name = "Deleted", Environment = "Staging" };
        deleted.SoftDelete();
        db.TestRuns.AddRange(
            new TestRun { ProjectId = project.Id, Name = "Active", Environment = "Staging" },
            deleted);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.GetAllAsync(project.Id);

        result.Should().HaveCount(1).And.ContainSingle(r => r.Name == "Active");
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.GetByIdAsync(project.Id, run.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(run.Id);
        result.Name.Should().Be("Run 1");
        result.Environment.Should().Be("Staging");
    }

    [Fact]
    public async Task GetByIdAsync_WhenWrongProject_ReturnsNull()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.GetByIdAsync(Guid.NewGuid(), run.Id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExistsAsync_WhenExists_ReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.ExistsAsync(project.Id, run.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WhenWrongProject_ReturnsFalse()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.ExistsAsync(Guid.NewGuid(), run.Id);

        result.Should().BeFalse();
    }

    [Fact]
    public async Task AddAsync_PersistsRunAndReturnsDto()
    {
        var (db, project) = await SeedProjectAsync();
        var repo = new TestRunRepository(db);
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };

        var result = await repo.AddAsync(run);

        result.Name.Should().Be("Run 1");
        result.Environment.Should().Be("Staging");
        result.ProjectId.Should().Be(project.Id);
        db.TestRuns.Should().ContainSingle(r => r.Id == run.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Old", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.UpdateAsync(project.Id, run.Id, r => { r.Name = "New"; r.Environment = "Production"; });

        result.Should().BeTrue();
        var updated = await db.TestRuns.FindAsync(run.Id);
        updated!.Name.Should().Be("New");
        updated.Environment.Should().Be("Production");
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project) = await SeedProjectAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.UpdateAsync(project.Id, Guid.NewGuid(), r => r.Name = "x");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        var (db, project) = await SeedProjectAsync();
        var run = new TestRun { ProjectId = project.Id, Name = "Run 1", Environment = "Staging" };
        db.TestRuns.Add(run);
        await db.SaveChangesAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.DeleteAsync(project.Id, run.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync(project.Id);
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        var (db, project) = await SeedProjectAsync();
        var repo = new TestRunRepository(db);

        var result = await repo.DeleteAsync(project.Id, Guid.NewGuid());

        result.Should().BeFalse();
    }
}