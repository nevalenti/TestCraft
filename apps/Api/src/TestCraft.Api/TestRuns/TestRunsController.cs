using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestRuns;

namespace TestCraft.Api.TestRuns;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs")]
public class TestRunsController(ISender sender) : ControllerBase
{
    /// <summary>Lists test runs for a project, optionally filtered by name.</summary>
    [HttpGet]
    public async Task<ActionResult<Paginated<TestRunResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestRuns.Query query,
        CancellationToken cancellationToken
    )
    {
        return Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Gets a test run by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestRunResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetTestRunById.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );
    }

    /// <summary>Gets the result counts (passed/failed/skipped/etc.) for a test run.</summary>
    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<GetTestRunSummary.Response>> GetSummary(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetTestRunSummary.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );
    }

    /// <summary>Creates a new test run.</summary>
    [HttpPost]
    public async Task<ActionResult<TestRunResponse>> Create(
        Guid projectId,
        CreateTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        var run = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = run.Id }, run);
    }

    /// <summary>Updates a test run's name, environment, and status.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestRunResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(command with { ProjectId = projectId, Id = id }, cancellationToken)
        );
    }

    /// <summary>Gets persisted log lines for a test run.</summary>
    [HttpGet("{id:guid}/logs")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetLogs(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetRunLogs.Query { ProjectId = projectId, RunId = id },
                cancellationToken
            )
        );
    }

    /// <summary>Appends log lines to the live feed for a test run.</summary>
    [HttpPost("{id:guid}/logs")]
    public async Task<IActionResult> AppendLogs(
        Guid projectId,
        Guid id,
        AppendRunLogs.Command command,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(command with { ProjectId = projectId, RunId = id }, cancellationToken);
        return NoContent();
    }

    /// <summary>Deletes a test run.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestRun.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
