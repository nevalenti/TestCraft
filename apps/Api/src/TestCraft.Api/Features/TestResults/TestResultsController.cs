using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestResults;

namespace TestCraft.Api.Features.TestResults;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ISender sender) : ControllerBase
{
    /// <summary>Lists results for a test run.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<TestResultResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestResultResponse>>> GetAll(
        ProjectId projectId,
        TestRunId runId,
        [FromQuery] GetTestResults.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId, RunId = runId };
        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test result by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TestResultResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestResultResponse>> GetById(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestResultById.Query
        {
            ProjectId = projectId,
            RunId = runId,
            Id = id,
        };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Records a test result for a run.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TestResultResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestResultResponse>> Create(
        ProjectId projectId,
        TestRunId runId,
        CreateTestResult.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, RunId = runId };
        var result = await sender.Send(scopedCommand, cancellationToken);

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

    /// <summary>Records a test result by suite and test case name, creating them if they don't exist.</summary>
    [HttpPost("by-name")]
    [ProducesResponseType(typeof(TestResultResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestResultResponse>> CreateByName(
        ProjectId projectId,
        TestRunId runId,
        CreateTestResultByName.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, RunId = runId };
        var result = await sender.Send(scopedCommand, cancellationToken);

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

    /// <summary>Updates a test result.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TestResultResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestResultResponse>> Update(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        UpdateTestResult.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, RunId = runId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a test result.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestResult.Command
        {
            ProjectId = projectId,
            RunId = runId,
            Id = id,
        };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
