namespace Application.TestCases;

public interface ITestCasesService
{
    Task<IEnumerable<TestCaseDto>> GetAllAsync(Guid projectId, Guid suiteId, string? search = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<TestCaseDto>> GetAllByProjectAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TestCaseDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default);
    Task<TestCaseDto?> CreateAsync(Guid projectId, Guid suiteId, CreateTestCaseDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid id, UpdateTestCaseDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default);
}