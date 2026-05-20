using Domain.Entities;

namespace Application.TestRuns;

public interface ITestRunRepository
{
    Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestRunDto> AddAsync(TestRun run, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid id, Action<TestRun> mutate, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
}