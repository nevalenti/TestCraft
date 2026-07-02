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
    public async Task<ActionResult<IReadOnlyList<ProjectMemberResponse>>> GetAll(
        Guid projectId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetProjectMembers.Query { ProjectId = projectId },
                cancellationToken
            )
        );

    /// <summary>Adds a user to a project by email. Owner-only.</summary>
    [HttpPost]
    public async Task<ActionResult<ProjectMemberResponse>> Add(
        Guid projectId,
        AddProjectMember.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>Removes a member from a project. Owner-only.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RemoveProjectMember.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
