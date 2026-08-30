using Asp.Versioning;

using MediatR;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.Projects;

namespace TestCraft.Api.Features.Projects;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects")]
public class ProjectsController(ISender sender) : ControllerBase
{
    /// <summary>Lists projects owned by the current user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<ProjectResponse>), StatusCodes.Status200OK)]
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
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectResponse>> GetById(
        ProjectId id,
        CancellationToken cancellationToken
    )
    {
        var query = new GetProjectById.Query { Id = id };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Creates a new project.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status201Created)]
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
    [ProducesResponseType(typeof(ProjectResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectResponse>> Update(
        ProjectId id,
        UpdateProject.Command command,
        CancellationToken cancellationToken
    )
    {
        var scopedCommand = command with { Id = id };

        var result = await sender.Send(scopedCommand, cancellationToken);

        return Ok(result);
    }

    /// <summary>Deletes a project.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(ProjectId id, CancellationToken cancellationToken)
    {
        var command = new DeleteProject.Command { Id = id };

        await sender.Send(command, cancellationToken);

        return NoContent();
    }
}
