using Application.TestCases;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases")]
public class ProjectCasesController(ITestCasesService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TestCaseDto>>> GetCases(Guid projectId, CancellationToken cancellationToken)
        => Ok(await service.GetAllByProjectAsync(projectId, cancellationToken));
}