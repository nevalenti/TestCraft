using Domain.Enums;

namespace Application.TestResults;

public interface ITestResultsService
{
    Task<IEnumerable<TestResultDto>> GetAllAsync(Guid projectId, Guid runId, TestResultStatus? status = null, CancellationToken cancellationToken = default);
    Task<TestResultDto?> GetByIdAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default);
    Task<TestResultDto?> CreateAsync(Guid projectId, Guid runId, CreateTestResultDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid runId, Guid id, UpdateTestResultDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default);
}