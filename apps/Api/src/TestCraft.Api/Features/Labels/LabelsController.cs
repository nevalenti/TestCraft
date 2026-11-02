using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Api.Features.Labels;

[ApiTokenScope("labels")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/labels")]
public class LabelsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists labels for a project.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<LabelResponse>>> GetAll(
        ProjectId projectId,
        [FromQuery] GetLabels.Query query,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(query with { ProjectId = projectId }, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a label.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<LabelResponse>> Update(
        ProjectId projectId,
        LabelId id,
        UpdateLabel.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with
        {
            ProjectId = projectId,
            Id = id,
            ExpectedVersion = ExpectedVersion(ifMatch),
        };

        var result = await sender.Send(scopedCommand, cancellationToken);

        SetETag(result.Version);

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
