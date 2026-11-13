using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Api.Configuration.RateLimiting;
using TestCraft.Application.Features.ProjectMembers;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Features.ProjectMembers;

[ProjectRoles(Write = ProjectRole.Admin)]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/members")]
public class ProjectMembersController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists members of a project.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ProjectMemberResponse>>> GetAll(
        ProjectId projectId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetProjectMembers.Query { ProjectId = projectId },
                cancellationToken
            )
        );

    /// <summary>
    /// Adds a user to a project by email, as an editor unless a role is given. Only the owner
    /// can add admins.
    /// </summary>
    [HttpPost]
    [MemberInviteRateLimit]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<ProjectMemberResponse>> Add(
        ProjectId projectId,
        AddProjectMember.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                ActorRole = CurrentProjectRole,
            },
            cancellationToken
        );

        return StatusCode(StatusCodes.Status201Created, result);
    }

    /// <summary>Changes a member's role. Only the owner can grant or take away admin.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectMemberResponse>> Update(
        ProjectId projectId,
        ProjectMemberId id,
        UpdateProjectMember.Command command,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    Id = id,
                    ActorRole = CurrentProjectRole,
                },
                cancellationToken
            )
        );

    /// <summary>Removes a member from a project. Only the owner can remove admins.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(
        ProjectId projectId,
        ProjectMemberId id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new RemoveProjectMember.Command
            {
                ProjectId = projectId,
                Id = id,
                ActorRole = CurrentProjectRole,
            },
            cancellationToken
        );

        return NoContent();
    }
}
