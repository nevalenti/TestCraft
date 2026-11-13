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
    ) =>
        Ok(
            await sender.Send(
                query with
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                },
                cancellationToken
            )
        );

    /// <summary>Gets a test case step by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestCaseStepResponse>> GetById(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId caseId,
        TestCaseStepId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                new GetTestCaseStepById.Query
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                    Id = id,
                },
                cancellationToken
            )
        );

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
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                CaseId = caseId,
            },
            cancellationToken
        );

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
        await sender.Send(
            command with
            {
                ProjectId = projectId,
                CaseId = caseId,
            },
            cancellationToken
        );

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
    ) =>
        OkWithETag(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    CaseId = caseId,
                    Id = id,
                    ExpectedVersion = ExpectedVersion(ifMatch),
                },
                cancellationToken
            )
        );

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
        await sender.Send(
            new DeleteTestCaseStep.Command
            {
                ProjectId = projectId,
                CaseId = caseId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
