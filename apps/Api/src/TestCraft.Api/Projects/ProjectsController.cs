using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Projects;
using TestCraft.Application.Projects.Commands.CreateProject;
using TestCraft.Application.Projects.Commands.DeleteProject;
using TestCraft.Application.Projects.Commands.UpdateProject;
using TestCraft.Application.Projects.Queries.GetProjectById;
using TestCraft.Application.Projects.Queries.GetProjects;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Projects;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects")]
public class ProjectsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<ProjectResponse>>> GetAll(
        [FromQuery] GetProjectsQuery query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query, cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(new GetProjectByIdQuery { Id = id }, cancellationToken));

    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Create(
        CreateProjectCommand command,
        CancellationToken cancellationToken
    )
    {
        var project = await sender.Send(command, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteProjectCommand { Id = id }, cancellationToken);

        return NoContent();
    }
}
