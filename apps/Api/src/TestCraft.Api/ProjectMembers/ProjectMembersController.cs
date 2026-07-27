using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.ProjectMembers;

namespace TestCraft.Api.ProjectMembers;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/members")]
public class ProjectMembersController(ISender sender) : ControllerBase
{
    /// <summary>Lists members of a project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectMemberResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectMemberResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetProjectMembers.Query { ProjectId = projectId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Adds a user to a project by email. Owner-only.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectMemberResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<ProjectMemberResponse>> Add(
        Guid projectId,
        AddProjectMember.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };
        var result = await sender.Send(scopedCommand, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>Removes a member from a project. Owner-only.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        var command = new RemoveProjectMember.Command { ProjectId = projectId, Id = id };
        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
