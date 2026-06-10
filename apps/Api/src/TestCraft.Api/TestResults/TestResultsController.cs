using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestResults;
using TestCraft.Application.TestResults.Commands.CreateTestResult;
using TestCraft.Application.TestResults.Commands.DeleteTestResult;
using TestCraft.Application.TestResults.Commands.UpdateTestResult;
using TestCraft.Application.TestResults.Queries.GetTestResultById;
using TestCraft.Application.TestResults.Queries.GetTestResults;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.TestResults;

[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestResultResponse>>> GetAll(
        Guid projectId,
        Guid runId,
        [FromQuery] TestResultQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestResultsQuery
                {
                    ProjectId = projectId,
                    RunId = runId,
                    Status = query.Status,
                    Search = query.Search,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestResultResponse>> GetById(
        Guid projectId,
        Guid runId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestResultByIdQuery
                {
                    ProjectId = projectId,
                    RunId = runId,
                    Id = id,
                },
                cancellationToken
            )
        );

    [HttpPost]
    public async Task<ActionResult<TestResultResponse>> Create(
        Guid projectId,
        Guid runId,
        CreateTestResultRequest request,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            new CreateTestResultCommand
            {
                ProjectId = projectId,
                RunId = runId,
                TestCaseId = request.TestCaseId,
                Status = request.Status,
                Notes = request.Notes,
                ExecutedAt = request.ExecutedAt,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                runId,
                id = result.Id,
            },
            result
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestResultResponse>> Update(
        Guid projectId,
        Guid runId,
        Guid id,
        UpdateTestResultRequest request,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new UpdateTestResultCommand
                {
                    ProjectId = projectId,
                    RunId = runId,
                    Id = id,
                    Status = request.Status,
                    Notes = request.Notes,
                },
                cancellationToken
            )
        );

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid runId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestResultCommand
            {
                ProjectId = projectId,
                RunId = runId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
