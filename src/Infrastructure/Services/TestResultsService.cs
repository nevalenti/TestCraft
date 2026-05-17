using Application.TestResults;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TestResultsService(AppDbContext db) : ITestResultsService
{
    public async Task<IEnumerable<TestResultDto>> GetAllAsync(Guid projectId, Guid runId, CancellationToken cancellationToken = default)
    {
        return await db.TestResults
            .Where(r =>
                r.TestRunId == runId &&
                r.TestRun.ProjectId == projectId)
            .Select(r => new TestResultDto(r.Id, r.TestRunId, r.TestCaseId, r.Status, r.Notes, r.ExecutedAt, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<TestResultDto?> GetByIdAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
    {
        return await db.TestResults
            .Where(r =>
                r.Id == id &&
                r.TestRunId == runId &&
                r.TestRun.ProjectId == projectId)
            .Select(r => new TestResultDto(r.Id, r.TestRunId, r.TestCaseId, r.Status, r.Notes, r.ExecutedAt, r.ExecutedById, r.CreatedAt, r.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TestResultDto?> CreateAsync(Guid projectId, Guid runId, CreateTestResultDto dto, CancellationToken cancellationToken = default)
    {
        var runExists = await db.TestRuns
            .AnyAsync(r => r.Id == runId && r.ProjectId == projectId, cancellationToken);

        if (!runExists)
            return null;

        var testCaseInProject = await db.TestCases
            .AnyAsync(c => c.Id == dto.TestCaseId && c.Suite.ProjectId == projectId, cancellationToken);

        if (!testCaseInProject)
            return null;

        var result = new TestResult
        {
            TestRunId = runId,
            TestCaseId = dto.TestCaseId,
            Status = dto.Status,
            Notes = dto.Notes,
            ExecutedAt = dto.ExecutedAt
        };

        db.TestResults.Add(result);
        await db.SaveChangesAsync(cancellationToken);

        return new TestResultDto(result.Id, result.TestRunId, result.TestCaseId, result.Status, result.Notes, result.ExecutedAt, result.ExecutedById, result.CreatedAt, result.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid runId, Guid id, UpdateTestResultDto dto, CancellationToken cancellationToken = default)
    {
        var result = await db.TestResults
            .FirstOrDefaultAsync(r =>
                r.Id == id &&
                r.TestRunId == runId &&
                r.TestRun.ProjectId == projectId,
                cancellationToken);

        if (result is null)
            return false;

        result.Status = dto.Status;
        result.Notes = dto.Notes;

        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
    {
        var result = await db.TestResults
            .FirstOrDefaultAsync(r =>
                r.Id == id &&
                r.TestRunId == runId &&
                r.TestRun.ProjectId == projectId,
                cancellationToken);

        if (result is null)
            return false;

        result.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}