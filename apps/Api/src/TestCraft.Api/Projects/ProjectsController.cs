using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Projects;
using TestCraft.Application.Projects.Commands.CreateProject;
using TestCraft.Application.Projects.Commands.DeleteProject;
using TestCraft.Application.Projects.Commands.UpdateProject;
using TestCraft.Application.Projects.Queries.GetProjectById;
using TestCraft.Application.Projects.Queries.GetProjects;

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
        [FromQuery] GetProjectsQuery query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query, cancellationToken));

    /// <summary>Gets a project by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetProjectByIdQuery { Id = id }, cancellationToken));

    /// <summary>Creates a new project.</summary>
    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(
        CreateProjectCommand command,
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
        UpdateProjectCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command, cancellationToken));
    }

    /// <summary>Deletes a project.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteProjectCommand { Id = id }, cancellationToken);

        return NoContent();
    }
}
