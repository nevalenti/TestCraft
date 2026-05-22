using Application.TestRuns;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs")]
public class TestRunsController(ITestRunsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestRunDto>>> GetRuns(Guid projectId, CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(projectId, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestRunDto>> GetRun(Guid projectId, Guid id, CancellationToken cancellationToken)
    {
        var run = await service.GetByIdAsync(projectId, id, cancellationToken);
        return run is null ? NotFound() : Ok(run);
    }

    [HttpGet("{id:guid}/summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestRunSummaryDto>> GetRunSummary(Guid projectId, Guid id, CancellationToken cancellationToken)
    {
        var summary = await service.GetSummaryAsync(projectId, id, cancellationToken);
        return summary is null ? NotFound() : Ok(summary);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestRunDto>> CreateRun(Guid projectId, CreateTestRunDto request, CancellationToken cancellationToken)
    {
        var run = await service.CreateAsync(projectId, request, cancellationToken);
        if (run is null) return NotFound();
        return CreatedAtAction(nameof(GetRun), new { projectId, id = run.Id }, run);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRun(Guid projectId, Guid id, UpdateTestRunDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(projectId, id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRun(Guid projectId, Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(projectId, id, cancellationToken) ? NoContent() : NotFound();
}