using Application.TestRuns;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TestRunsService(AppDbContext db) : ITestRunsService
{
    public async Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await db.TestRuns
            .Where(r => r.ProjectId == projectId)
            .Select(r => new TestRunDto(r.Id, r.ProjectId, r.Name, r.Environment, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        return await db.TestRuns
            .Where(r => r.Id == id && r.ProjectId == projectId)
            .Select(r => new TestRunDto(r.Id, r.ProjectId, r.Name, r.Environment, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TestRunDto?> CreateAsync(Guid projectId, CreateTestRunDto dto, CancellationToken cancellationToken = default)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
            return null;

        var run = new TestRun
        {
            Name = dto.Name,
            Environment = dto.Environment,
            ProjectId = projectId
        };

        db.TestRuns.Add(run);
        await db.SaveChangesAsync(cancellationToken);

        return new TestRunDto(run.Id, run.ProjectId, run.Name, run.Environment, run.ExecutedById, run.CreatedAt, run.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestRunDto dto, CancellationToken cancellationToken = default)
    {
        var run = await db.TestRuns
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId, cancellationToken);

        if (run is null)
            return false;

        run.Name = dto.Name;
        run.Environment = dto.Environment;

        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        var run = await db.TestRuns
            .FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId, cancellationToken);

        if (run is null)
            return false;

        run.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}