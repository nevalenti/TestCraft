using MediatR;

using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Features.ProjectMembers;

namespace TestCraft.Api.Features.ProjectMembers;

[Route("api/v{version:apiVersion}/projects/{projectId:guid}/members")]
public class ProjectMembersController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists members of a project.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ProjectMemberResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectMemberResponse>>> GetAll(
        ProjectId projectId,
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
        ProjectId projectId,
        AddProjectMember.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { ProjectId = projectId };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Removes a member from a project. Owner-only.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(
        ProjectId projectId,
        ProjectMemberId id,
        CancellationToken cancellationToken
    )
    {
        var command = new RemoveProjectMember.Command { ProjectId = projectId, Id = id };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
