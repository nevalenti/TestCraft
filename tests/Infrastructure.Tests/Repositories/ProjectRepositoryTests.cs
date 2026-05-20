using Application.Projects;

using AwesomeAssertions;

using Domain.Entities;

using Infrastructure.Data;
using Infrastructure.Repositories;

using Microsoft.EntityFrameworkCore;

using Xunit;

namespace Infrastructure.Tests.Repositories;

public class ProjectRepositoryTests
{
    private static AppDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    [Fact]
    public async Task GetAllAsync_ReturnsAllProjects()
    {
        using var db = CreateContext();
        db.Projects.AddRange(
            new Project { Name = "Alpha" },
            new Project { Name = "Beta" });
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_ExcludesSoftDeletedProjects()
    {
        using var db = CreateContext();
        var deleted = new Project { Name = "Deleted" };
        deleted.SoftDelete();
        db.Projects.AddRange(new Project { Name = "Active" }, deleted);
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.GetAllAsync();

        result.Should().HaveCount(1).And.ContainSingle(p => p.Name == "Active");
    }

    [Fact]
    public async Task GetAllAsync_IncludesSuiteAndRunCounts()
    {
        using var db = CreateContext();
        var project = new Project { Name = "Alpha" };
        db.Projects.Add(project);
        db.TestSuites.AddRange(
            new TestSuite { ProjectId = project.Id, Name = "S1" },
            new TestSuite { ProjectId = project.Id, Name = "S2" });
        db.TestRuns.Add(new TestRun { ProjectId = project.Id, Name = "R1", Environment = "Staging" });
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = (await repo.GetAllAsync()).Single();

        result.SuiteCount.Should().Be(2);
        result.RunCount.Should().Be(1);
    }

    [Fact]
    public async Task GetByIdAsync_WhenFound_ReturnsDto()
    {
        using var db = CreateContext();
        var project = new Project { Name = "Alpha", Description = "desc" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.GetByIdAsync(project.Id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(project.Id);
        result.Name.Should().Be("Alpha");
        result.Description.Should().Be("desc");
    }

    [Fact]
    public async Task GetByIdAsync_WhenNotFound_ReturnsNull()
    {
        using var db = CreateContext();
        var repo = new ProjectRepository(db);

        var result = await repo.GetByIdAsync(Guid.NewGuid());

        result.Should().BeNull();
    }

    [Fact]
    public async Task ExistsAsync_WhenExists_ReturnsTrue()
    {
        using var db = CreateContext();
        var project = new Project { Name = "Alpha" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.ExistsAsync(project.Id);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WhenNotFound_ReturnsFalse()
    {
        using var db = CreateContext();
        var repo = new ProjectRepository(db);

        var result = await repo.ExistsAsync(Guid.NewGuid());

        result.Should().BeFalse();
    }

    [Fact]
    public async Task AddAsync_PersistsProjectAndReturnsDto()
    {
        using var db = CreateContext();
        var repo = new ProjectRepository(db);
        var project = new Project { Name = "Alpha", Description = "desc" };

        var result = await repo.AddAsync(project);

        result.Name.Should().Be("Alpha");
        result.Description.Should().Be("desc");
        db.Projects.Should().ContainSingle(p => p.Id == project.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenFound_AppliesMutationAndReturnsTrue()
    {
        using var db = CreateContext();
        var project = new Project { Name = "Old", Description = "Old desc" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.UpdateAsync(project.Id, p => { p.Name = "New"; p.Description = "New desc"; });

        result.Should().BeTrue();
        var updated = await db.Projects.FindAsync(project.Id);
        updated!.Name.Should().Be("New");
        updated.Description.Should().Be("New desc");
    }

    [Fact]
    public async Task UpdateAsync_WhenNotFound_ReturnsFalse()
    {
        using var db = CreateContext();
        var repo = new ProjectRepository(db);

        var result = await repo.UpdateAsync(Guid.NewGuid(), p => p.Name = "x");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_WhenFound_SoftDeletesAndReturnsTrue()
    {
        using var db = CreateContext();
        var project = new Project { Name = "Alpha" };
        db.Projects.Add(project);
        await db.SaveChangesAsync();
        var repo = new ProjectRepository(db);

        var result = await repo.DeleteAsync(project.Id);

        result.Should().BeTrue();
        var all = await repo.GetAllAsync();
        all.Should().BeEmpty();
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ReturnsFalse()
    {
        using var db = CreateContext();
        var repo = new ProjectRepository(db);

        var result = await repo.DeleteAsync(Guid.NewGuid());

        result.Should().BeFalse();
    }
}