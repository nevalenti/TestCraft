using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Projects;

namespace TestCraft.Api.Projects;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects")]
public class ProjectsController(ISender sender) : ControllerBase
{
    /// <summary>Lists projects owned by the current user.</summary>
    [HttpGet]
    public async Task<ActionResult<Paginated<ProjectResponse>>> GetAll(
        [FromQuery] GetProjects.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query, cancellationToken));

    /// <summary>Gets a project by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetProjectById.Query { Id = id }, cancellationToken));

    /// <summary>Creates a new project.</summary>
    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(
        CreateProject.Command command,
        CancellationToken cancellationToken
    )
    {
        var project = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    /// <summary>Updates a project's details.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> Update(
        Guid id,
        UpdateProject.Command command,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(command with { Id = id }, cancellationToken));

    /// <summary>Deletes a project.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteProject.Command { Id = id }, cancellationToken);

        return NoContent();
    }
}
