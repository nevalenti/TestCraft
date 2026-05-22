using Domain.Entities;

namespace Application.TestCaseSteps;

public interface ITestCaseStepRepository
{
    Task<IEnumerable<TestCaseStepDto>> GetAllAsync(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken = default);
    Task<TestCaseStepDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default);
    Task<TestCaseStepDto> AddAsync(TestCaseStep step, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, Action<TestCaseStep> mutate, CancellationToken cancellationToken = default);
    Task<bool> BulkReorderAsync(Guid projectId, Guid suiteId, Guid caseId, IList<StepOrderDto> steps, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default);
}