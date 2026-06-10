using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCases.Queries.GetTestCasesByProject;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.TestCases;

[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId:guid}/cases")]
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
