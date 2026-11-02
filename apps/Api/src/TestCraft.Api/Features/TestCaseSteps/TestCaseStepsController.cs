using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCaseSteps;

namespace TestCraft.Api.Features.TestCaseSteps;

[ApiTokenScope("cases")]
[Route(
    "api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases/{caseId:guid}/steps"
)]
public class TestCaseStepsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists the steps for a test case.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestCaseStepResponse>>> GetAll(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        [FromQuery] GetTestCaseSteps.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId, CaseId = caseId };

        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test case step by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestCaseStepResponse>> GetById(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        TestCaseStepId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestCaseStepById.Query
        {
            ProjectId = projectId,
            CaseId = caseId,
            Id = id,
        };

        var result = await sender.Send(query, cancellationToken);

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Adds a step to a test case.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestCaseStepResponse>> Create(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        CreateTestCaseStep.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, CaseId = caseId };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                suiteId,
                caseId,
                id = result.Id,
            },
            result
        );
    }

    /// <summary>Reorders the steps of a test case.</summary>
    [HttpPut("reorder")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> BulkReorder(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        BulkReorderSteps.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, CaseId = caseId };

        await sender.Send(scopedCommand, cancellationToken);

        return NoContent();
    }

    /// <summary>Updates a test case step.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestCaseStepResponse>> Update(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        TestCaseStepId id,
        UpdateTestCaseStep.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with
        {
            ProjectId = projectId,
            CaseId = caseId,
            Id = id,
            ExpectedVersion = ExpectedVersion(ifMatch),
        };

        var result = await sender.Send(scopedCommand, cancellationToken);

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Deletes a test case step.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        TestCaseStepId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestCaseStep.Command
        {
            ProjectId = projectId,
            CaseId = caseId,
            Id = id,
        };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
