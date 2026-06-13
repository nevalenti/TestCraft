using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestRuns.Commands.CreateTestRun;
using TestCraft.Application.TestRuns.Commands.DeleteTestRun;
using TestCraft.Application.TestRuns.Commands.UpdateTestRun;
using TestCraft.Application.TestRuns.Queries.GetTestRunById;
using TestCraft.Application.TestRuns.Queries.GetTestRuns;
using TestCraft.Application.TestRuns.Queries.GetTestRunSummary;

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
        [FromQuery] GetTestRunsQuery query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));

    /// <summary>Gets a test run by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestRunResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunByIdQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Gets the result counts (passed/failed/skipped/etc.) for a test run.</summary>
    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<TestRunStatusResponse>> GetSummary(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunSummaryQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Creates a new test run.</summary>
    [HttpPost]
    public async Task<ActionResult<TestRunResponse>> Create(
        Guid projectId,
        CreateTestRunCommand command,
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
        UpdateTestRunCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
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
            new DeleteTestRunCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
