namespace Application.TestRuns;

public interface ITestRunsService
{
    Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestRunSummaryDto?> GetSummaryAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestRunDto?> CreateAsync(Guid projectId, CreateTestRunDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestRunDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
}