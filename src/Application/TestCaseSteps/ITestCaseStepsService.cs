namespace Application.TestCaseSteps;

public interface ITestCaseStepsService
{
    Task<IEnumerable<TestCaseStepDto>> GetAllAsync(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken = default);
    Task<TestCaseStepDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default);
    Task<TestCaseStepDto?> CreateAsync(Guid projectId, Guid suiteId, Guid caseId, CreateTestCaseStepDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, UpdateTestCaseStepDto dto, CancellationToken cancellationToken = default);
    Task<bool> BulkReorderAsync(Guid projectId, Guid suiteId, Guid caseId, BulkReorderStepsDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default);
}