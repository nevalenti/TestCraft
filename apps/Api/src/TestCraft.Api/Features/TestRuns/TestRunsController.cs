using Asp.Versioning;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestRuns;

namespace TestCraft.Api.Features.TestRuns;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs")]
public class TestRunsController(ISender sender) : ControllerBase
{
    /// <summary>Lists test runs for a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<TestRunResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestRunResponse>>> GetAll(
        ProjectId projectId,
        [FromQuery] GetTestRuns.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId };
        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test run by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TestRunResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestRunResponse>> GetById(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestRunById.Query { ProjectId = projectId, Id = id };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets the result counts (passed/failed/skipped/etc.) for a test run.</summary>
    [HttpGet("{id:guid}/summary")]
    [ProducesResponseType(typeof(GetTestRunSummary.Response), StatusCodes.Status200OK)]
    public async Task<ActionResult<GetTestRunSummary.Response>> GetSummary(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestRunSummary.Query { ProjectId = projectId, Id = id };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a new test run.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TestRunResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestRunResponse>> Create(
        ProjectId projectId,
        CreateTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Updates a test run's name, environment, and status.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TestRunResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestRunResponse>> Update(
        ProjectId projectId,
        TestRunId id,
        UpdateTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets persisted log lines for a test run.</summary>
    [HttpGet("{id:guid}/logs")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<string>>> GetLogs(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetRunLogs.Query { ProjectId = projectId, RunId = id };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Appends log lines to the live feed for a test run.</summary>
    [HttpPost("{id:guid}/logs")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AppendLogs(
        ProjectId projectId,
        TestRunId id,
        AppendRunLogs.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, RunId = id };
        await sender.Send(scopedCommand, cancellationToken);

        return NoContent();
    }

    /// <summary>Deletes a test run.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestRun.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
