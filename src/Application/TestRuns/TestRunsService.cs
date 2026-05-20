using Application.Projects;

using Domain.Entities;

namespace Application.TestRuns;

public class TestRunsService(IProjectRepository projects, ITestRunRepository runs) : ITestRunsService
{
    public Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
        => runs.GetAllAsync(projectId, cancellationToken);

    public Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => runs.GetByIdAsync(projectId, id, cancellationToken);

    public async Task<TestRunDto?> CreateAsync(Guid projectId, CreateTestRunDto dto, CancellationToken cancellationToken = default)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
            return null;

        return await runs.AddAsync(
            new TestRun { Name = dto.Name, Environment = dto.Environment, ProjectId = projectId },
            cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestRunDto dto, CancellationToken cancellationToken = default)
        => runs.UpdateAsync(projectId, id, r => { r.Name = dto.Name; r.Environment = dto.Environment; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => runs.DeleteAsync(projectId, id, cancellationToken);
}