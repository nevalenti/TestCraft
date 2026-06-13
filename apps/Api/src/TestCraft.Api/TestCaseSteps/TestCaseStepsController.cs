using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestCaseSteps;
using TestCraft.Application.TestCaseSteps.Commands.BulkReorderSteps;
using TestCraft.Application.TestCaseSteps.Commands.CreateTestCaseStep;
using TestCraft.Application.TestCaseSteps.Commands.DeleteTestCaseStep;
using TestCraft.Application.TestCaseSteps.Commands.UpdateTestCaseStep;
using TestCraft.Application.TestCaseSteps.Queries.GetTestCaseStepById;
using TestCraft.Application.TestCaseSteps.Queries.GetTestCaseSteps;

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
        [FromQuery] GetTestCaseStepsQuery query,
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
                new GetTestCaseStepByIdQuery
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
        CreateTestCaseStepCommand command,
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
        BulkReorderStepsCommand command,
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
        UpdateTestCaseStepCommand command,
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
            new DeleteTestCaseStepCommand
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
