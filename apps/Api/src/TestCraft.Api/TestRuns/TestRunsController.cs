using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestRuns;
using TestCraft.Application.TestRuns.Commands.CreateTestRun;
using TestCraft.Application.TestRuns.Commands.DeleteTestRun;
using TestCraft.Application.TestRuns.Commands.UpdateTestRun;
using TestCraft.Application.TestRuns.Queries.GetTestRunById;
using TestCraft.Application.TestRuns.Queries.GetTestRuns;
using TestCraft.Application.TestRuns.Queries.GetTestRunSummary;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.TestRuns;

[Authorize]
[ApiController]
[Route("api/v1/projects/{projectId:guid}/runs")]
public class TestRunsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestRunResponse>>> GetAll(
        Guid projectId,
        [FromQuery] TestRunQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunsQuery
                {
                    ProjectId = projectId,
                    Search = query.Search,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestRunResponse>> GetById(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunByIdQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}/summary")]
    public async Task<ActionResult<TestRunStatusResponse>> GetSummary(
        Guid projectId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunSummaryQuery { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    [HttpPost]
    public async Task<ActionResult<TestRunResponse>> Create(
        Guid projectId,
        CreateTestRunRequest request,
        CancellationToken cancellationToken
    )
    {
        var run = await sender.Send(
            new CreateTestRunCommand
            {
                ProjectId = projectId,
                Name = request.Name,
                Environment = request.Environment,
                Status = request.Status,
            },
            cancellationToken
        );

        return CreatedAtAction(nameof(GetById), new { projectId, id = run.Id }, run);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestRunResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestRunRequest request,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new UpdateTestRunCommand
                {
                    ProjectId = projectId,
                    Id = id,
                    Name = request.Name,
                    Environment = request.Environment,
                    Status = request.Status,
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
            new DeleteTestRunCommand { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }
}
