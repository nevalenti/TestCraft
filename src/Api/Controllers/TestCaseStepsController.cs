using Application.TestCaseSteps;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases/{caseId:guid}/steps")]
public class TestCaseStepsController(ITestCaseStepsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestCaseStepDto>>> GetSteps(Guid projectId, Guid suiteId, Guid caseId, CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(projectId, suiteId, caseId, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestCaseStepDto>> GetStep(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken)
    {
        var step = await service.GetByIdAsync(projectId, suiteId, caseId, id, cancellationToken);

        return step is null ? NotFound() : Ok(step);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestCaseStepDto>> CreateStep(Guid projectId, Guid suiteId, Guid caseId, CreateTestCaseStepDto request, CancellationToken cancellationToken)
    {
        var step = await service.CreateAsync(projectId, suiteId, caseId, request, cancellationToken);

        if (step is null)
            return NotFound();

        return CreatedAtAction(nameof(GetStep), new { projectId, suiteId, caseId, id = step.Id }, step);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStep(Guid projectId, Guid suiteId, Guid caseId, Guid id, UpdateTestCaseStepDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(projectId, suiteId, caseId, id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStep(Guid projectId, Guid suiteId, Guid caseId, Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(projectId, suiteId, caseId, id, cancellationToken) ? NoContent() : NotFound();
}