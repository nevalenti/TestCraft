using Application.TestResults;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TestResultRepository(AppDbContext db) : ITestResultRepository
{
    public async Task<IEnumerable<TestResultDto>> GetAllAsync(Guid projectId, Guid runId, CancellationToken cancellationToken = default)
        => await db.TestResults
            .Where(r => r.TestRunId == runId && r.TestRun.ProjectId == projectId)
            .Select(r => new TestResultDto(r.Id, r.TestRunId, r.TestCaseId, r.Status, r.Notes, r.ExecutedAt, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<TestResultDto?> GetByIdAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
        => await db.TestResults
            .Where(r => r.Id == id && r.TestRunId == runId && r.TestRun.ProjectId == projectId)
            .Select(r => new TestResultDto(r.Id, r.TestRunId, r.TestCaseId, r.Status, r.Notes, r.ExecutedAt, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<TestResultDto> AddAsync(TestResult result, CancellationToken cancellationToken = default)
    {
        db.TestResults.Add(result);
        await db.SaveChangesAsync(cancellationToken);

        return new TestResultDto(result.Id, result.TestRunId, result.TestCaseId, result.Status, result.Notes, result.ExecutedAt, result.ExecutedById, result.CreatedAt, result.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid runId, Guid id, Action<TestResult> mutate, CancellationToken cancellationToken = default)
    {
        var result = await db.TestResults
            .FirstOrDefaultAsync(r => r.Id == id && r.TestRunId == runId && r.TestRun.ProjectId == projectId, cancellationToken);
        if (result is null) return false;

        mutate(result);
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
    {
        var result = await db.TestResults
            .FirstOrDefaultAsync(r => r.Id == id && r.TestRunId == runId && r.TestRun.ProjectId == projectId, cancellationToken);
        if (result is null) return false;

        result.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}