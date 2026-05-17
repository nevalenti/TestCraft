using Application.TestResults;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ITestResultsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestResultDto>>> GetResults(Guid projectId, Guid runId, CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(projectId, runId, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResultDto>> GetResult(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken)
    {
        var result = await service.GetByIdAsync(projectId, runId, id, cancellationToken);

        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestResultDto>> CreateResult(Guid projectId, Guid runId, CreateTestResultDto request, CancellationToken cancellationToken)
    {
        var result = await service.CreateAsync(projectId, runId, request, cancellationToken);

        if (result is null)
            return NotFound();

        return CreatedAtAction(nameof(GetResult), new { projectId, runId, id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateResult(Guid projectId, Guid runId, Guid id, UpdateTestResultDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(projectId, runId, id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteResult(Guid projectId, Guid runId, Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(projectId, runId, id, cancellationToken) ? NoContent() : NotFound();
}