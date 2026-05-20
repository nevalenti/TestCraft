using Application.TestCaseSteps;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TestCaseStepRepository(AppDbContext db) : ITestCaseStepRepository
{
    public async Task<IEnumerable<TestCaseStepDto>> GetAllAsync(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken = default)
        => await db.TestCaseSteps
            .Where(s => s.TestCaseId == caseId && s.TestCase.SuiteId == suiteId && s.TestCase.Suite.ProjectId == projectId)
            .OrderBy(s => s.Order)
            .Select(s => new TestCaseStepDto(s.Id, s.TestCaseId, s.Order, s.Action, s.ExpectedResult, s.CreatedAt, s.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<TestCaseStepDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
        => await db.TestCaseSteps
            .Where(s => s.Id == id && s.TestCaseId == caseId && s.TestCase.SuiteId == suiteId && s.TestCase.Suite.ProjectId == projectId)
            .Select(s => new TestCaseStepDto(s.Id, s.TestCaseId, s.Order, s.Action, s.ExpectedResult, s.CreatedAt, s.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<TestCaseStepDto> AddAsync(TestCaseStep step, CancellationToken cancellationToken = default)
    {
        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync(cancellationToken);

        return new TestCaseStepDto(step.Id, step.TestCaseId, step.Order, step.Action, step.ExpectedResult, step.CreatedAt, step.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, Action<TestCaseStep> mutate, CancellationToken cancellationToken = default)
    {
        var step = await db.TestCaseSteps
            .FirstOrDefaultAsync(s => s.Id == id && s.TestCaseId == caseId && s.TestCase.SuiteId == suiteId && s.TestCase.Suite.ProjectId == projectId, cancellationToken);
        if (step is null) return false;

        mutate(step);
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var step = await db.TestCaseSteps
            .FirstOrDefaultAsync(s => s.Id == id && s.TestCaseId == caseId && s.TestCase.SuiteId == suiteId && s.TestCase.Suite.ProjectId == projectId, cancellationToken);
        if (step is null) return false;

        step.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}