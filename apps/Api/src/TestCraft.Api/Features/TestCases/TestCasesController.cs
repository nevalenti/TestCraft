using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;

namespace TestCraft.Api.Features.TestCases;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases")]
public class TestCasesController(ISender sender) : ControllerBase
{
    /// <summary>Lists test cases in a suite, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<TestCaseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        Guid suiteId,
        [FromQuery] GetTestCases.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId, SuiteId = suiteId };
        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test case by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TestCaseResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestCaseResponse>> GetById(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestCaseById.Query
        {
            ProjectId = projectId,
            SuiteId = suiteId,
            Id = id,
        };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a new test case in a suite.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TestCaseResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestCaseResponse>> Create(
        Guid projectId,
        Guid suiteId,
        CreateTestCase.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, SuiteId = suiteId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                suiteId,
                id = result.Id,
            },
            result
        );
    }

    /// <summary>Updates a test case's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TestCaseResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestCaseResponse>> Update(
        Guid projectId,
        Guid suiteId,
        Guid id,
        UpdateTestCase.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, SuiteId = suiteId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a test case.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestCase.Command
        {
            ProjectId = projectId,
            SuiteId = suiteId,
            Id = id,
        };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
