using Asp.Versioning;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Features.TestPlans;
using TestCraft.Application.Features.TestRuns;

namespace TestCraft.Api.Features.TestPlans;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/plans")]
public class TestPlansController(ISender sender) : ControllerBase
{
    /// <summary>Lists test plans for a project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<TestPlanResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TestPlanResponse>>> GetAll(
        ProjectId projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestPlans.Query { ProjectId = projectId };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a test plan by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TestPlanDetailResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestPlanDetailResponse>> GetById(
        ProjectId projectId,
        TestPlanId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetTestPlanById.Query { ProjectId = projectId, Id = id };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a test plan.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TestPlanResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestPlanResponse>> Create(
        ProjectId projectId,
        CreateTestPlan.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Updates a test plan.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(TestPlanResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TestPlanResponse>> Update(
        ProjectId projectId,
        TestPlanId id,
        UpdateTestPlan.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a test plan.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestPlanId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteTestPlan.Command { ProjectId = projectId, Id = id };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>Adds a test case to a plan.</summary>
    [HttpPost("{id:guid}/cases")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AddCase(
        ProjectId projectId,
        TestPlanId id,
        AddCaseToPlan.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, TestPlanId = id };

        await sender.Send(scopedCommand, cancellationToken);

        return NoContent();
    }

    /// <summary>Removes a test case from a plan.</summary>
    [HttpDelete("{id:guid}/cases/{caseId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveCase(
        ProjectId projectId,
        TestPlanId id,
        TestCaseId caseId,
        CancellationToken cancellationToken
    )
    {
        var command = new RemoveCaseFromPlan.Command
        {
            ProjectId = projectId,
            TestPlanId = id,
            TestCaseId = caseId,
        };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>Reorders cases in a test plan.</summary>
    [HttpPut("{id:guid}/cases/order")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ReorderCases(
        ProjectId projectId,
        TestPlanId id,
        ReorderPlanCases.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, TestPlanId = id };

        await sender.Send(scopedCommand, cancellationToken);

        return NoContent();
    }

    /// <summary>Creates a test run from a plan.</summary>
    [HttpPost("{id:guid}/run")]
    [ProducesResponseType(typeof(TestRunResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<TestRunResponse>> CreateRun(
        ProjectId projectId,
        TestPlanId id,
        CreateRunFromPlan.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, TestPlanId = id };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return Created($"{ApiPaths.V1Prefix}/projects/{projectId}/runs/{result.Id}", result);
    }
}
