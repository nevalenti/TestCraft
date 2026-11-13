using MediatR;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Authorization;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;

namespace TestCraft.Api.Features.TestCases;

[ApiTokenScope("cases")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases")]
public class ProjectTestCasesController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists test cases across all suites in a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        ProjectId projectId,
        [FromQuery] GetTestCasesByProject.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));
}
