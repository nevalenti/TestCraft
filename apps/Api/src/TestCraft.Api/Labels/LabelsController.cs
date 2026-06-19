using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Labels;
using TestCraft.Application.Labels.Commands.AddTestCaseLabel;
using TestCraft.Application.Labels.Commands.CreateLabel;
using TestCraft.Application.Labels.Commands.DeleteLabel;
using TestCraft.Application.Labels.Commands.RemoveTestCaseLabel;
using TestCraft.Application.Labels.Commands.UpdateLabel;
using TestCraft.Application.Labels.Queries.GetLabels;

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
    ) => Ok(await sender.Send(new GetLabelsQuery { ProjectId = projectId }, cancellationToken));

    /// <summary>Creates a label.</summary>
    [HttpPost]
    public async Task<ActionResult<LabelResponse>> Create(
        Guid projectId,
        CreateLabelCommand command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));

    /// <summary>Updates a label.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<LabelResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateLabelCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
    }

    /// <summary>Deletes a label.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteLabelCommand { ProjectId = projectId, Id = id },
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
            new AddTestCaseLabelCommand
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
            new RemoveTestCaseLabelCommand
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
