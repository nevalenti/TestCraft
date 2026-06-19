using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestPlans;
using TestCraft.Application.TestPlans.Commands.AddCaseToPlan;
using TestCraft.Application.TestPlans.Commands.CreateRunFromPlan;
using TestCraft.Application.TestPlans.Commands.CreateTestPlan;
using TestCraft.Application.TestPlans.Commands.DeleteTestPlan;
using TestCraft.Application.TestPlans.Commands.RemoveCaseFromPlan;
using TestCraft.Application.TestPlans.Commands.ReorderPlanCases;
using TestCraft.Application.TestPlans.Commands.UpdateTestPlan;
using TestCraft.Application.TestPlans.Queries.GetTestPlanById;
using TestCraft.Application.TestPlans.Queries.GetTestPlans;
using TestCraft.Application.TestRuns;

namespace TestCraft.Api.TestPlans;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/plans")]
public class TestPlansController(ISender sender) : ControllerBase
{
    /// <summary>Lists test plans for a project.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TestPlanResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetTestPlansQuery { ProjectId = projectId }, cancellationToken));

    /// <summary>Gets a test plan by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestPlanResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestPlanByIdQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Creates a test plan.</summary>
    [HttpPost]
    public async Task<ActionResult<TestPlanResponse>> Create(
        Guid projectId,
        CreateTestPlanCommand command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Updates a test plan.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestPlanResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestPlanCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Deletes a test plan.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestPlanCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Adds a test case to a plan.</summary>
    [HttpPost("{id:guid}/cases")]
    public async Task<IActionResult> AddCase(
        Guid projectId,
        Guid id,
        AddCaseToPlanCommand command,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            command with
            {
                ProjectId = projectId,
                TestPlanId = id,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Removes a test case from a plan.</summary>
    [HttpDelete("{id:guid}/cases/{caseId:guid}")]
    public async Task<IActionResult> RemoveCase(
        Guid projectId,
        Guid id,
        Guid caseId,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RemoveCaseFromPlanCommand
            {
                ProjectId = projectId,
                TestPlanId = id,
                TestCaseId = caseId,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Reorders cases in a test plan.</summary>
    [HttpPut("{id:guid}/cases/order")]
    public async Task<IActionResult> ReorderCases(
        Guid projectId,
        Guid id,
        ReorderPlanCasesCommand command,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            command with
            {
                ProjectId = projectId,
                TestPlanId = id,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Creates a test run from a plan.</summary>
    [HttpPost("{id:guid}/run")]
    public async Task<ActionResult<TestRunResponse>> CreateRun(
        Guid projectId,
        Guid id,
        CreateRunFromPlanCommand command,
        CancellationToken cancellationToken
    )
    {
        var run = await sender.Send(
            command with
            {
                ProjectId = projectId,
                TestPlanId = id,
            },
            cancellationToken
        );

        return Created($"/api/v1/projects/{projectId}/runs/{run.Id}", run);
    }
}
