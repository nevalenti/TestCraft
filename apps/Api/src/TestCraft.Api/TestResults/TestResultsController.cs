using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestResults;

namespace TestCraft.Api.TestResults;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ISender sender) : ControllerBase
{
    /// <summary>Lists results for a test run.</summary>
    [HttpGet]
    public async Task<ActionResult<Paginated<TestResultResponse>>> GetAll(
        Guid projectId,
        Guid runId,
        [FromQuery] GetTestResults.Query query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                query with
                {
                    ProjectId = projectId,
                    RunId = runId,
                },
                cancellationToken
            )
        );

    /// <summary>Gets a test result by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestResultResponse>> GetById(
        Guid projectId,
        Guid runId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestResultById.Query
                {
                    ProjectId = projectId,
                    RunId = runId,
                    Id = id,
                },
                cancellationToken
            )
        );

    /// <summary>Records a test result for a run.</summary>
    [HttpPost]
    public async Task<ActionResult<TestResultResponse>> Create(
        Guid projectId,
        Guid runId,
        CreateTestResult.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                RunId = runId,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                runId,
                id = result.Id,
            },
            result
        );
    }

    /// <summary>Updates a test result.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestResultResponse>> Update(
        Guid projectId,
        Guid runId,
        Guid id,
        UpdateTestResult.Command command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    RunId = runId,
                },
                cancellationToken
            )
        );
    }

    /// <summary>Deletes a test result.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid runId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestResult.Command
            {
                ProjectId = projectId,
                RunId = runId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
