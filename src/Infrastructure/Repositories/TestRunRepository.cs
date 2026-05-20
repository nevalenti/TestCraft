using Application.TestRuns;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TestRunRepository(AppDbContext db) : ITestRunRepository
{
    public async Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
        => await db.TestRuns
            .Where(r => r.ProjectId == projectId)
            .Select(r => new TestRunDto(r.Id, r.ProjectId, r.Name, r.Environment, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => await db.TestRuns
            .Where(r => r.Id == id && r.ProjectId == projectId)
            .Select(r => new TestRunDto(r.Id, r.ProjectId, r.Name, r.Environment, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => db.TestRuns.AnyAsync(r => r.Id == id && r.ProjectId == projectId, cancellationToken);

    public async Task<TestRunDto> AddAsync(TestRun run, CancellationToken cancellationToken = default)
    {
        db.TestRuns.Add(run);
        await db.SaveChangesAsync(cancellationToken);

        return new TestRunDto(run.Id, run.ProjectId, run.Name, run.Environment, run.ExecutedById, run.CreatedAt, run.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid id, Action<TestRun> mutate, CancellationToken cancellationToken = default)
    {
        var run = await db.TestRuns.FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId, cancellationToken);
        if (run is null) return false;

        mutate(run);
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        var run = await db.TestRuns.FirstOrDefaultAsync(r => r.Id == id && r.ProjectId == projectId, cancellationToken);
        if (run is null) return false;

        run.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}