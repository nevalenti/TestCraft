using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestSuites;

namespace TestCraft.Api.TestSuites;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites")]
public class TestSuitesController(ISender sender) : ControllerBase
{
    /// <summary>Lists test suites for a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<TestSuiteResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestSuiteResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestSuites.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId };
        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test suite by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TestSuiteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestSuiteResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestSuiteById.Query { ProjectId = projectId, Id = id };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a new test suite.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TestSuiteResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestSuiteResponse>> Create(
        Guid projectId,
        CreateTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Updates a test suite's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TestSuiteResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestSuiteResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a test suite.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestSuite.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
