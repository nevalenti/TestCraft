using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestResults;

namespace TestCraft.Api.Features.TestResults;

[ApiTokenScope("results")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists results for a test run.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
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
    [ProducesResponseType(StatusCodes.Status200OK)]
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

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Records a test result for a run.</summary>
    [HttpPost]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
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
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestResultResponse>> Update(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        UpdateTestResult.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with
        {
            ProjectId = projectId,
            RunId = runId,
            Id = id,
            ExpectedVersion = ExpectedVersion(ifMatch),
        };

        var result = await sender.Send(scopedCommand, cancellationToken);

        SetETag(result.Version);

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
