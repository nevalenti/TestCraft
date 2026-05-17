using Application.TestCaseSteps;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TestCaseStepsService(AppDbContext db) : ITestCaseStepsService
{
    public async Task<IEnumerable<TestCaseStepDto>> GetAllAsync(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken = default)
    {
        return await db.TestCaseSteps
            .Where(s =>
                s.TestCaseId == caseId &&
                s.TestCase.SuiteId == suiteId &&
                s.TestCase.Suite.ProjectId == projectId)
            .OrderBy(s => s.Order)
            .Select(s => new TestCaseStepDto(s.Id, s.TestCaseId, s.Order, s.Action, s.ExpectedResult, s.CreatedAt, s.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<TestCaseStepDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        return await db.TestCaseSteps
            .Where(s =>
                s.Id == id &&
                s.TestCaseId == caseId &&
                s.TestCase.SuiteId == suiteId &&
                s.TestCase.Suite.ProjectId == projectId)
            .Select(s => new TestCaseStepDto(s.Id, s.TestCaseId, s.Order, s.Action, s.ExpectedResult, s.CreatedAt, s.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TestCaseStepDto?> CreateAsync(Guid projectId, Guid suiteId, Guid caseId, CreateTestCaseStepDto dto, CancellationToken cancellationToken = default)
    {
        var caseExists = await db.TestCases
            .AnyAsync(c =>
                c.Id == caseId &&
                c.SuiteId == suiteId &&
                c.Suite.ProjectId == projectId,
                cancellationToken);

        if (!caseExists)
            return null;

        var step = new TestCaseStep
        {
            Order = dto.Order,
            Action = dto.Action,
            ExpectedResult = dto.ExpectedResult,
            TestCaseId = caseId
        };

        db.TestCaseSteps.Add(step);
        await db.SaveChangesAsync(cancellationToken);

        return new TestCaseStepDto(step.Id, step.TestCaseId, step.Order, step.Action, step.ExpectedResult, step.CreatedAt, step.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, UpdateTestCaseStepDto dto, CancellationToken cancellationToken = default)
    {
        var step = await db.TestCaseSteps
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                s.TestCaseId == caseId &&
                s.TestCase.SuiteId == suiteId &&
                s.TestCase.Suite.ProjectId == projectId,
                cancellationToken);

        if (step is null)
            return false;

        step.Order = dto.Order;
        step.Action = dto.Action;
        step.ExpectedResult = dto.ExpectedResult;

        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
    {
        var step = await db.TestCaseSteps
            .FirstOrDefaultAsync(s =>
                s.Id == id &&
                s.TestCaseId == caseId &&
                s.TestCase.SuiteId == suiteId &&
                s.TestCase.Suite.ProjectId == projectId,
                cancellationToken);

        if (step is null)
            return false;

        step.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}