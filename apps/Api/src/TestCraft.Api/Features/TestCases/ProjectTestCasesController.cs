using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;

namespace TestCraft.Api.Features.TestCases;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases")]
public class ProjectTestCasesController(ISender sender) : ControllerBase
{
    /// <summary>Lists test cases across all suites in a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(Paginated<TestCaseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestCasesByProject.Query query,
        CancellationToken cancellationToken
    )
    {
        var scopedQuery = query with { ProjectId = projectId };
        var result = await sender.Send(scopedQuery, cancellationToken);

        return Ok(result);
    }
}
