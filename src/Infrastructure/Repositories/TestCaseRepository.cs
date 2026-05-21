using Application.TestCases;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TestCaseRepository(AppDbContext db) : ITestCaseRepository
{
    public async Task<IEnumerable<TestCaseDto>> GetAllAsync(Guid projectId, Guid suiteId, CancellationToken cancellationToken = default)
        => await db.TestCases
            .Where(c => c.SuiteId == suiteId && c.Suite.ProjectId == projectId)
            .Select(c => new TestCaseDto(c.Id, c.SuiteId, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IEnumerable<TestCaseDto>> GetAllByProjectAsync(Guid projectId, CancellationToken cancellationToken = default)
        => await db.TestCases
            .Where(c => c.Suite.ProjectId == projectId)
            .OrderBy(c => c.SuiteId).ThenBy(c => c.Name)
            .Select(c => new TestCaseDto(c.Id, c.SuiteId, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<TestCaseDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
        => await db.TestCases
            .Where(c => c.Id == id && c.SuiteId == suiteId && c.Suite.ProjectId == projectId)
            .Select(c => new TestCaseDto(c.Id, c.SuiteId, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
        => db.TestCases.AnyAsync(c => c.Id == id && c.SuiteId == suiteId && c.Suite.ProjectId == projectId, cancellationToken);

    public Task<bool> ExistsInProjectAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => db.TestCases.AnyAsync(c => c.Id == id && c.Suite.ProjectId == projectId, cancellationToken);

    public async Task<TestCaseDto> AddAsync(TestCase testCase, CancellationToken cancellationToken = default)
    {
        db.TestCases.Add(testCase);
        await db.SaveChangesAsync(cancellationToken);

        return new TestCaseDto(testCase.Id, testCase.SuiteId, testCase.Name, testCase.Description, testCase.CreatedAt, testCase.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid id, Action<TestCase> mutate, CancellationToken cancellationToken = default)
    {
        var testCase = await db.TestCases
            .FirstOrDefaultAsync(c => c.Id == id && c.SuiteId == suiteId && c.Suite.ProjectId == projectId, cancellationToken);
        if (testCase is null) return false;

        mutate(testCase);
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
    {
        var testCase = await db.TestCases
            .FirstOrDefaultAsync(c => c.Id == id && c.SuiteId == suiteId && c.Suite.ProjectId == projectId, cancellationToken);
        if (testCase is null) return false;

        testCase.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}