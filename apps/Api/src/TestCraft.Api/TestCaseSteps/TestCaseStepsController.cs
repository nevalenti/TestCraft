using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestCaseSteps;

namespace TestCraft.Api.TestCaseSteps;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route(
    "api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases/{caseId:guid}/steps"
)]
public class TestCaseStepsController(ISender sender) : ControllerBase
{
    /// <summary>Lists the steps for a test case.</summary>
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseStepResponse>>> GetAll(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
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
    public async Task<ActionResult<TestCaseStepResponse>> GetById(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
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
    public async Task<ActionResult<TestCaseStepResponse>> Create(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        CreateTestCaseStep.Command command,
        CancellationToken cancellationToken
    )
    {
        var step = await sender.Send(
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
                id = step.Id,
            },
            step
        );
    }

    /// <summary>Reorders the steps of a test case.</summary>
    [HttpPut("reorder")]
    public async Task<IActionResult> BulkReorder(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
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
    public async Task<ActionResult<TestCaseStepResponse>> Update(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
        UpdateTestCaseStep.Command command,
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
                    CaseId = caseId,
                },
                cancellationToken
            )
        );
    }

    /// <summary>Deletes a test case step.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid suiteId,
        Guid caseId,
        Guid id,
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
