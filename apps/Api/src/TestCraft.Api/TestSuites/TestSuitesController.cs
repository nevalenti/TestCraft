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
    public async Task<ActionResult<Paginated<TestSuiteResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestSuites.Query query,
        CancellationToken cancellationToken
    )
    {
        return Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Gets a test suite by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestSuiteResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(
                new GetTestSuiteById.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );
    }

    /// <summary>Creates a new test suite.</summary>
    [HttpPost]
    public async Task<ActionResult<TestSuiteResponse>> Create(
        Guid projectId,
        CreateTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        var suite = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = suite.Id }, suite);
    }

    /// <summary>Updates a test suite's details.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestSuiteResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        return Ok(
            await sender.Send(command with { ProjectId = projectId, Id = id }, cancellationToken)
        );
    }

    /// <summary>Deletes a test suite.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestSuite.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
