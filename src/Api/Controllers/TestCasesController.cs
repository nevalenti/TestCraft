using Application.TestCases;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases")]
public class TestCasesController(ITestCasesService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestCaseDto>>> GetCases(Guid projectId, Guid suiteId, [FromQuery] string? search, CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(projectId, suiteId, search, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestCaseDto>> GetCase(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken)
    {
        var testCase = await service.GetByIdAsync(projectId, suiteId, id, cancellationToken);
        return testCase is null ? NotFound() : Ok(testCase);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TestCaseDto>> CreateCase(Guid projectId, Guid suiteId, CreateTestCaseDto request, CancellationToken cancellationToken)
    {
        var testCase = await service.CreateAsync(projectId, suiteId, request, cancellationToken);
        if (testCase is null) return NotFound();
        return CreatedAtAction(nameof(GetCase), new { projectId, suiteId, id = testCase.Id }, testCase);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCase(Guid projectId, Guid suiteId, Guid id, UpdateTestCaseDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(projectId, suiteId, id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCase(Guid projectId, Guid suiteId, Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(projectId, suiteId, id, cancellationToken) ? NoContent() : NotFound();
}