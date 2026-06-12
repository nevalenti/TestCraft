using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Api.Requests;
using TestCraft.Application.Commands;
using TestCraft.Application.Queries;
using TestCraft.Application.Responses;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.Controllers;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites")]
public class TestSuitesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestSuiteResponse>>> GetAll(
        Guid projectId,
        [FromQuery] TestSuiteQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestSuitesQuery
                {
                    ProjectId = projectId,
                    Search = query.Search,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestSuiteResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestSuiteByIdQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    [HttpPost]
    public async Task<ActionResult<TestSuiteResponse>> Create(
        Guid projectId,
        CreateTestSuiteRequest request,
        CancellationToken cancellationToken
    )
    {
        var suite = await sender.Send(
            new CreateTestSuiteCommand
            {
                ProjectId = projectId,
                Name = request.Name,
                Description = request.Description,
            },
            cancellationToken
        );

        return CreatedAtAction(nameof(GetById), new { projectId, id = suite.Id }, suite);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestSuiteResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestSuiteRequest request,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new UpdateTestSuiteCommand
                {
                    ProjectId = projectId,
                    Id = id,
                    Name = request.Name,
                    Description = request.Description,
                },
                cancellationToken
            )
        );

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestSuiteCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
