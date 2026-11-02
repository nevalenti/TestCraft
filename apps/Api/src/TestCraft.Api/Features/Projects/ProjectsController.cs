using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.OutputCaching;
using TestCraft.Api.Configuration.OutputCaching;
using TestCraft.Api.Realtime;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Projects;

namespace TestCraft.Api.Features.Projects;

[Route("api/v{version:apiVersion}/projects")]
public class ProjectsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists projects owned by the current user.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<ProjectResponse>>> GetAll(
        [FromQuery] GetProjects.Query query,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Gets a project by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectResponse>> GetById(
        ProjectId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetProjectById.Query { Id = id };

        var result = await sender.Send(query, cancellationToken);

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>Creates a new project.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<ProjectResponse>> Create(
        CreateProject.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Updates a project's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<ProjectResponse>> Update(
        ProjectId id,
        UpdateProject.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { Id = id, ExpectedVersion = ExpectedVersion(ifMatch) };

        var result = await sender.Send(scopedCommand, cancellationToken);

        SetETag(result.Version);

        return Ok(result);
    }

    /// <summary>
    /// Issues a single-use ticket for the dashboard WebSocket, <c>/ws/dashboard?ticket=</c>;
    /// connect within 30 seconds. It reports run changes in every project you can see.
    /// </summary>
    [HttpPost("dashboard/ws-ticket")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<SocketTicketResponse>> CreateDashboardSocketTicket(
        [FromServices] SocketTickets tickets,
        [FromServices] ICurrentUser currentUser
    ) =>
        Ok(
            new SocketTicketResponse
            {
                Ticket = await tickets.IssueForDashboardAsync(
                    currentUser.UserId,
                    SignedInSession.ExpiresAt(User)
                ),
            }
        );

    /// <summary>Deletes a project.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId id,
        [FromServices] IOutputCacheStore cacheStore,
        CancellationToken cancellationToken
    )
    {
        var command = new DeleteProject.Command { Id = id };

        await sender.Send(command, cancellationToken);
        await cacheStore.EvictPublicSharesAsync(cancellationToken);

        return NoContent();
    }
}
