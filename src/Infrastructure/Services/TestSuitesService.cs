using Application.TestSuites;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class TestSuitesService(AppDbContext db) : ITestSuitesService
{
    public async Task<IEnumerable<TestSuiteDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await db.TestSuites
            .Where(s => s.ProjectId == projectId)
            .Select(s => new TestSuiteDto(s.Id, s.ProjectId, s.Name, s.Description, s.CreatedAt, s.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<TestSuiteDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        return await db.TestSuites
            .Where(s => s.ProjectId == projectId && s.Id == id)
            .Select(s => new TestSuiteDto(s.Id, s.ProjectId, s.Name, s.Description, s.CreatedAt, s.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<TestSuiteDto?> CreateAsync(Guid projectId, CreateTestSuiteDto dto, CancellationToken cancellationToken = default)
    {
        var projectExists = await db.Projects.AnyAsync(p => p.Id == projectId, cancellationToken);
        if (!projectExists)
            return null;

        var suite = new TestSuite
        {
            Name = dto.Name,
            Description = dto.Description,
            ProjectId = projectId
        };

        db.TestSuites.Add(suite);
        await db.SaveChangesAsync(cancellationToken);

        return new TestSuiteDto(suite.Id, suite.ProjectId, suite.Name, suite.Description, suite.CreatedAt, suite.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestSuiteDto dto, CancellationToken cancellationToken = default)
    {
        var suite = await db.TestSuites
            .FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Id == id, cancellationToken);

        if (suite is null)
            return false;

        suite.Name = dto.Name;
        suite.Description = dto.Description;

        await db.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        var suite = await db.TestSuites
            .FirstOrDefaultAsync(s => s.ProjectId == projectId && s.Id == id, cancellationToken);

        if (suite is null)
            return false;

        suite.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);

        return true;
    }
}