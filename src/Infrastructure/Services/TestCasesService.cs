using Application.TestCases;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TestCasesService(AppDbContext db) : ITestCasesService
{
    public async Task<IEnumerable<TestCaseDto>> GetAllAsync(Guid projectId, Guid suiteId, CancellationToken cancellationToken = default)
    {
        return await db.TestCases
            .Where(c =>
                c.SuiteId == suiteId &&
                c.Suite.ProjectId == projectId)
            .Select(c => new TestCaseDto(c.Id, c.SuiteId, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<TestCaseDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
    {
        return await db.TestCases
            .Where(c =>
                c.Id == id &&
                c.SuiteId == suiteId &&
                c.Suite.ProjectId == projectId)
            .Select(c => new TestCaseDto(c.Id, c.SuiteId, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TestCaseDto?> CreateAsync(Guid projectId, Guid suiteId, CreateTestCaseDto dto, CancellationToken cancellationToken = default)
    {
        var suiteExists = await db.TestSuites
            .AnyAsync(s => s.Id == suiteId && s.ProjectId == projectId, cancellationToken);

        if (!suiteExists)
            return null;

        var testCase = new TestCase
        {
            Name = dto.Name,
            Description = dto.Description,
            SuiteId = suiteId
        };

        db.TestCases.Add(testCase);
        await db.SaveChangesAsync(cancellationToken);

        return new TestCaseDto(testCase.Id, testCase.SuiteId, testCase.Name, testCase.Description, testCase.CreatedAt, testCase.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid id, UpdateTestCaseDto dto, CancellationToken cancellationToken = default)
    {
        var testCase = await db.TestCases
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.SuiteId == suiteId &&
                c.Suite.ProjectId == projectId,
                cancellationToken);

        if (testCase is null)
            return false;

        testCase.Name = dto.Name;
        testCase.Description = dto.Description;

        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
    {
        var testCase = await db.TestCases
            .FirstOrDefaultAsync(c =>
                c.Id == id &&
                c.SuiteId == suiteId &&
                c.Suite.ProjectId == projectId,
                cancellationToken);

        if (testCase is null)
            return false;

        testCase.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}