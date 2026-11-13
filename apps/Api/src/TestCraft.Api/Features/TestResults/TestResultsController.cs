using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestResults;

namespace TestCraft.Api.Features.TestResults;

[ApiTokenScope("results")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs/{runId:guid}/results")]
public class TestResultsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists results for a test run.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestResultResponse>>> GetAll(
        ProjectId projectId,
        TestRunId runId,
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestResultResponse>> GetById(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
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
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestResultResponse>> Create(
        ProjectId projectId,
        TestRunId runId,
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

    /// <summary>Records a test result by suite and test case name, creating them if they don't exist.</summary>
    [HttpPost("by-name")]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestResultResponse>> CreateByName(
        ProjectId projectId,
        TestRunId runId,
        CreateTestResultByName.Command command,
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestResultResponse>> Update(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
        UpdateTestResult.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    RunId = runId,
                    Id = id,
                    ExpectedVersion = ExpectedVersion(ifMatch),
                },
                cancellationToken
            )
        );

    /// <summary>Deletes a test result.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestRunId runId,
        TestResultId id,
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
