using Domain.Entities;

namespace Application.Projects;

public interface IProjectRepository
{
    Task<IEnumerable<ProjectDto>> GetAllAsync(string? search = null, CancellationToken cancellationToken = default);
    Task<ProjectDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProjectDto> AddAsync(Project project, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid id, Action<Project> mutate, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}