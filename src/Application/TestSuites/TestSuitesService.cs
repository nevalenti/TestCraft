using Application.Projects;

using Domain.Entities;

namespace Application.TestSuites;

public class TestSuitesService(IProjectRepository projects, ITestSuiteRepository suites) : ITestSuitesService
{
    public Task<IEnumerable<TestSuiteDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
        => suites.GetAllAsync(projectId, cancellationToken);

    public Task<TestSuiteDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => suites.GetByIdAsync(projectId, id, cancellationToken);

    public async Task<TestSuiteDto?> CreateAsync(Guid projectId, CreateTestSuiteDto dto, CancellationToken cancellationToken = default)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
            return null;

        return await suites.AddAsync(
            new TestSuite { Name = dto.Name, Description = dto.Description, ProjectId = projectId },
            cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestSuiteDto dto, CancellationToken cancellationToken = default)
        => suites.UpdateAsync(projectId, id, s => { s.Name = dto.Name; s.Description = dto.Description; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => suites.DeleteAsync(projectId, id, cancellationToken);
}