using Application.TestCases;
using Application.TestRuns;

using Domain.Entities;

namespace Application.TestResults;

public class TestResultsService(ITestRunRepository runs, ITestCaseRepository cases, ITestResultRepository results) : ITestResultsService
{
    public Task<IEnumerable<TestResultDto>> GetAllAsync(Guid projectId, Guid runId, CancellationToken cancellationToken = default)
        => results.GetAllAsync(projectId, runId, cancellationToken);

    public Task<TestResultDto?> GetByIdAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
        => results.GetByIdAsync(projectId, runId, id, cancellationToken);

    public async Task<TestResultDto?> CreateAsync(Guid projectId, Guid runId, CreateTestResultDto dto, CancellationToken cancellationToken = default)
    {
        if (!await runs.ExistsAsync(projectId, runId, cancellationToken))
            return null;

        if (!await cases.ExistsInProjectAsync(projectId, dto.TestCaseId, cancellationToken))
            return null;

        return await results.AddAsync(new TestResult
        {
            TestRunId = runId,
            TestCaseId = dto.TestCaseId,
            Status = dto.Status,
            Notes = dto.Notes,
            ExecutedAt = dto.ExecutedAt
        }, cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid runId, Guid id, UpdateTestResultDto dto, CancellationToken cancellationToken = default)
        => results.UpdateAsync(projectId, runId, id, r => { r.Status = dto.Status; r.Notes = dto.Notes; }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken = default)
        => results.DeleteAsync(projectId, runId, id, cancellationToken);
}