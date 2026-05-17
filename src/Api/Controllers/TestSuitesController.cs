using Application.TestSuites;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites")]
public class TestSuitesController(ITestSuitesService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestSuiteDto>>> GetSuites(Guid projectId, CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(projectId, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestSuiteDto>> GetSuite(Guid projectId, Guid id, CancellationToken cancellationToken)
    {
        var suite = await service.GetByIdAsync(projectId, id, cancellationToken);

        return suite is null ? NotFound() : Ok(suite);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestSuiteDto>> CreateSuite(Guid projectId, CreateTestSuiteDto request, CancellationToken cancellationToken)
    {
        var suite = await service.CreateAsync(projectId, request, cancellationToken);

        if (suite is null)
            return NotFound();

        return CreatedAtAction(nameof(GetSuite), new { projectId, id = suite.Id }, suite);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSuite(Guid projectId, Guid id, UpdateTestSuiteDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(projectId, id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSuite(Guid projectId, Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(projectId, id, cancellationToken) ? NoContent() : NotFound();
}