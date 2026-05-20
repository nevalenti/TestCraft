using Application.Projects;

using Domain.Entities;

using Infrastructure.Data;

using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ProjectRepository(AppDbContext db) : IProjectRepository
{
    public async Task<IEnumerable<ProjectDto>> GetAllAsync(CancellationToken cancellationToken = default)
        => await db.Projects
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Description, p.CreatedAt, p.UpdatedAt,
                p.TestSuites.Count(s => !s.IsDeleted),
                p.TestRuns.Count(r => !r.IsDeleted)))
            .ToListAsync(cancellationToken);

    public async Task<ProjectDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await db.Projects
            .Where(p => p.Id == id)
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Description, p.CreatedAt, p.UpdatedAt,
                p.TestSuites.Count(s => !s.IsDeleted),
                p.TestRuns.Count(r => !r.IsDeleted)))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        => db.Projects.AnyAsync(p => p.Id == id, cancellationToken);

    public async Task<ProjectDto> AddAsync(Project project, CancellationToken cancellationToken = default)
    {
        db.Projects.Add(project);
        await db.SaveChangesAsync(cancellationToken);
        return new ProjectDto(project.Id, project.Name, project.Description, project.CreatedAt, project.UpdatedAt);
    }

    public async Task<bool> UpdateAsync(Guid id, Action<Project> mutate, CancellationToken cancellationToken = default)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (project is null) return false;

        mutate(project);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (project is null) return false;

        project.SoftDelete();
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }
}