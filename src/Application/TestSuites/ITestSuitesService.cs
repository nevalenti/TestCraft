namespace Application.TestSuites;

public interface ITestSuitesService
{
    Task<IEnumerable<TestSuiteDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TestSuiteDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestSuiteDto?> CreateAsync(Guid projectId, CreateTestSuiteDto dto, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestSuiteDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
}