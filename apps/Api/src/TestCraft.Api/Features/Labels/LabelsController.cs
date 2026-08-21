using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Api.Features.Labels;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/labels")]
public class LabelsController(ISender sender) : ControllerBase
{
    /// <summary>Lists labels for a project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<LabelResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LabelResponse>>> GetAll(
        ProjectId projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetLabels.Query { ProjectId = projectId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a label.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(LabelResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<LabelResponse>> Create(
        ProjectId projectId,
        CreateLabel.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Updates a label.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(LabelResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<LabelResponse>> Update(
        ProjectId projectId,
        LabelId id,
        UpdateLabel.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId, Id = id };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a label.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        LabelId id,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteLabel.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
