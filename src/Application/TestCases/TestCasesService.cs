using Application.TestSuites;

using Domain.Entities;

namespace Application.TestCases;

public class TestCasesService(ITestSuiteRepository suites, ITestCaseRepository cases) : ITestCasesService
{
    public Task<IEnumerable<TestCaseDto>> GetAllAsync(Guid projectId, Guid suiteId, CancellationToken cancellationToken = default)
        => cases.GetAllAsync(projectId, suiteId, cancellationToken);

    public Task<TestCaseDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
        => cases.GetByIdAsync(projectId, suiteId, id, cancellationToken);

    public async Task<TestCaseDto?> CreateAsync(Guid projectId, Guid suiteId, CreateTestCaseDto dto, CancellationToken cancellationToken = default)
    {
        if (!await suites.ExistsAsync(projectId, suiteId, cancellationToken))
            return null;

        return await cases.AddAsync(
            new TestCase { Name = dto.Name, Description = dto.Description, SuiteId = suiteId },
            cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid id, UpdateTestCaseDto dto, CancellationToken cancellationToken = default)
        => cases.UpdateAsync(projectId, suiteId, id, c => { c.Name = dto.Name; c.Description = dto.Description; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken = default)
        => cases.DeleteAsync(projectId, suiteId, id, cancellationToken);
}