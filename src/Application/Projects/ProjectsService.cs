using Domain.Entities;

namespace Application.Projects;

public class ProjectsService(IProjectRepository repository) : IProjectsService
{
    public Task<IEnumerable<ProjectDto>> GetAllAsync(string? search = null, CancellationToken cancellationToken = default)
        => repository.GetAllAsync(search, cancellationToken);

    public Task<ProjectDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => repository.GetByIdAsync(id, cancellationToken);

    public Task<ProjectDto> CreateAsync(CreateProjectDto dto, CancellationToken cancellationToken = default)
        => repository.AddAsync(new Project { Name = dto.Name, Description = dto.Description }, cancellationToken);

    public Task<bool> UpdateAsync(Guid id, UpdateProjectDto dto, CancellationToken cancellationToken = default)
        => repository.UpdateAsync(id, p => { p.Name = dto.Name; p.Description = dto.Description; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        => repository.DeleteAsync(id, cancellationToken);
}