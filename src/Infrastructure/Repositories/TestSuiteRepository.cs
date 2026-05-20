using Application.TestSuites;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TestSuiteRepository(AppDbContext db) : ITestSuiteRepository
{
    public async Task<IEnumerable<TestSuiteDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
        => await db.TestSuites
            .Where(s => s.ProjectId == projectId)
            .Select(s => new TestSuiteDto(s.Id, s.ProjectId, s.Name, s.Description, s.CreatedAt, s.UpdatedAt))
            .ToListAsync(cancellationToken);

    public async Task<TestSuiteDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => await db.TestSuites
            .Where(s => s.ProjectId == projectId && s.Id == id)
            .Select(s => new TestSuiteDto(s.Id, s.ProjectId, s.Name, s.Description, s.CreatedAt, s.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => db.TestSuites.AnyAsync(s => s.ProjectId == projectId && s.Id == id, cancellationToken);

    public async Task<TestSuiteDto> AddAsync(TestSuite suite, CancellationToken cancellationToken = default)
    {
        db.TestSuites.Add(suite);
        await db.SaveChangesAsync(cancellationToken);
        return new TestSuiteDto(suite.Id, suite.ProjectId, suite.Name, suite.Description, suite.CreatedAt, suite.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid id, Action<TestSuite> mutate, CancellationToken cancellationToken = default)
    {
        var suite = await db.TestSuites.FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Id == id, cancellationToken);
        if (suite is null) return false;

        mutate(suite);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        var suite = await db.TestSuites.FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Id == id, cancellationToken);
        if (suite is null) return false;

        suite.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}