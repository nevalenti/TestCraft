using Domain.Entities;

namespace Application.TestCases;

public interface ITestCaseRepository
{
    Task<IEnumerable<TestCaseDto>> GetAllAsync(Guid projectId, Guid suiteId, CancellationToken cancellationToken = default);
    Task<TestCaseDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsInProjectAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default);
    Task<TestCaseDto> AddAsync(TestCase testCase, CancellationToken cancellationToken = default);
    Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid id, Action<TestCase> mutate, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default);
}