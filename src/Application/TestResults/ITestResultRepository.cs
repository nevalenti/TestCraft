using Domain.Entities;
using Domain.Enums;

namespace Application.TestResults;

public interface ITestResultRepository
{
    Task<IEnumerable<TestResultDto>> GetAllAsync(Guid projectId, Guid runId, TestResultStatus? status = null, CancellationToken cancellationToken = default);
    Task<TestResultDto?> GetByIdAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default);
    Task<TestResultDto> AddAsync(TestResult result, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid runId, Guid id, Action<TestResult> mutate, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default);
}