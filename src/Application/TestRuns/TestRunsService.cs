using Application.Projects;
using Application.TestResults;

using Domain.Entities;
using Domain.Enums;

namespace Application.TestRuns;

public class TestRunsService(IProjectRepository projects, ITestRunRepository runs, ITestResultRepository results) : ITestRunsService
{
    public Task<IEnumerable<TestRunDto>> GetAllAsync(Guid projectId, CancellationToken cancellationToken = default)
        => runs.GetAllAsync(projectId, cancellationToken);

    public Task<TestRunDto?> GetByIdAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => runs.GetByIdAsync(projectId, id, cancellationToken);

    public async Task<TestRunSummaryDto?> GetSummaryAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
    {
        if (!await runs.ExistsAsync(projectId, id, cancellationToken))
            return null;

        var all = await results.GetAllAsync(projectId, id, null, cancellationToken);
        var list = all.ToList();
        var total = list.Count;
        if (total == 0)
            return new TestRunSummaryDto(0, 0, 0, 0, 0, 0);

        var passed = list.Count(r => r.Status == TestResultStatus.Passed);
        var failed = list.Count(r => r.Status == TestResultStatus.Failed);
        var blocked = list.Count(r => r.Status == TestResultStatus.Blocked);
        var skipped = list.Count(r => r.Status == TestResultStatus.Skipped);
        var passRate = (int)Math.Round(passed * 100.0 / total);

        return new TestRunSummaryDto(total, passed, failed, blocked, skipped, passRate);
    }

    public async Task<TestRunDto?> CreateAsync(Guid projectId, CreateTestRunDto dto, CancellationToken cancellationToken = default)
    {
        if (!await projects.ExistsAsync(projectId, cancellationToken))
            return null;

        return await runs.AddAsync(
            new TestRun { Name = dto.Name, Environment = dto.Environment, Status = dto.Status, ProjectId = projectId },
            cancellationToken);
    }

    public Task<bool> UpdateAsync(Guid projectId, Guid id, UpdateTestRunDto dto, CancellationToken cancellationToken = default)
        => runs.UpdateAsync(projectId, id, r =>
        {
            r.Name = dto.Name;
            r.Environment = dto.Environment;
            r.Status = dto.Status;
        }, cancellationToken);

    public Task<bool> DeleteAsync(Guid projectId, Guid id, CancellationToken cancellationToken = default)
        => runs.DeleteAsync(projectId, id, cancellationToken);
}