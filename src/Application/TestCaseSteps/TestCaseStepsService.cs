using Application.TestCases;

using Domain.Entities;

namespace Application.TestCaseSteps;

public class TestCaseStepsService(ITestCaseRepository cases, ITestCaseStepRepository steps) : ITestCaseStepsService
{
    public Task<IEnumerable<TestCaseStepDto>> GetAllAsync(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken = default)
        => steps.GetAllAsync(projectId, suiteId, caseId, cancellationToken);

    public Task<TestCaseStepDto?> GetByIdAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
        => steps.GetByIdAsync(projectId, suiteId, caseId, id, cancellationToken);

    public async Task<TestCaseStepDto?> CreateAsync(Guid projectId, Guid suiteId, Guid caseId, CreateTestCaseStepDto dto, CancellationToken cancellationToken = default)
    {
        if (!await cases.ExistsAsync(projectId, suiteId, caseId, cancellationToken))
            return null;

        return await steps.AddAsync(
            new TestCaseStep { Order = dto.Order, Action = dto.Action, ExpectedResult = dto.ExpectedResult, TestCaseId = caseId },
            cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, UpdateTestCaseStepDto dto, CancellationToken cancellationToken = default)
        => steps.UpdateAsync(projectId, suiteId, caseId, id, s => { s.Order = dto.Order; s.Action = dto.Action; s.ExpectedResult = dto.ExpectedResult; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken = default)
        => steps.DeleteAsync(projectId, suiteId, caseId, id, cancellationToken);
}