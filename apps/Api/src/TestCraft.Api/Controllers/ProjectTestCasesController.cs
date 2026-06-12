using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Requests;
using TestCraft.Application.Queries;
using TestCraft.Application.Responses;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Controllers;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/cases")]
public class ProjectTestCasesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        [FromQuery] TestCaseQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCasesByProjectQuery
                {
                    ProjectId = projectId,
                    Search = query.Search,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );
}
