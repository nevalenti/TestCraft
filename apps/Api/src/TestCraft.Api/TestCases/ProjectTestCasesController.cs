using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCases.Queries.GetTestCasesByProject;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.TestCases;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases")]
public class ProjectTestCasesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestCasesByProjectQuery query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));
}
