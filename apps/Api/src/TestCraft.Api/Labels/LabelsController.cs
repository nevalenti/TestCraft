using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Labels;

namespace TestCraft.Api.Labels;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/labels")]
public class LabelsController(ISender sender) : ControllerBase
{
    /// <summary>Lists labels for a project.</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LabelResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetLabels.Query { ProjectId = projectId }, cancellationToken));

    /// <summary>Creates a label.</summary>
    [HttpPost]
    public async Task<ActionResult<LabelResponse>> Create(
        Guid projectId,
        CreateLabel.Command command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));

    /// <summary>Updates a label.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LabelResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateLabel.Command command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { ProjectId = projectId, Id = id }, cancellationToken));

    /// <summary>Deletes a label.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteLabel.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases/{caseId:guid}/labels")]
public class TestCaseLabelsController(ISender sender) : ControllerBase
{
    /// <summary>Assigns a label to a test case.</summary>
    [HttpPost("{labelId:guid}")]
    public async Task<IActionResult> Add(
        Guid projectId,
        Guid caseId,
        Guid labelId,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new AddTestCaseLabel.Command
            {
                ProjectId = projectId,
                TestCaseId = caseId,
                LabelId = labelId,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Removes a label from a test case.</summary>
    [HttpDelete("{labelId:guid}")]
    public async Task<IActionResult> Remove(
        Guid projectId,
        Guid caseId,
        Guid labelId,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RemoveTestCaseLabel.Command
            {
                ProjectId = projectId,
                TestCaseId = caseId,
                LabelId = labelId,
            },
            cancellationToken
        );

        return NoContent();
    }
}
