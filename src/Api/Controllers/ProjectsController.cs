using Application.Projects;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProjectsController(IProjectsService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects(CancellationToken cancellationToken)
        => Ok(await service.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectDto>> GetProject(Guid id, CancellationToken cancellationToken)
    {
        var project = await service.GetByIdAsync(id, cancellationToken);
        return project is null ? NotFound() : Ok(project);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto request, CancellationToken cancellationToken)
    {
        var project = await service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProject(Guid id, UpdateProjectDto request, CancellationToken cancellationToken)
        => await service.UpdateAsync(id, request, cancellationToken) ? NoContent() : NotFound();

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject(Guid id, CancellationToken cancellationToken)
        => await service.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
}