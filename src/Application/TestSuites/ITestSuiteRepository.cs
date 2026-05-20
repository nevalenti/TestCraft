using Domain.Entities;

namespace Application.TestSuites;

public interface ITestSuiteRepository
{
    Task<IEnumerable<TestSuiteDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<TestSuiteDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestSuiteDto> AddAsync(TestSuite suite, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid id, Action<TestSuite> mutate, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
}