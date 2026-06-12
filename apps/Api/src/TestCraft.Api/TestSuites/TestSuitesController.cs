using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestSuites;
using TestCraft.Application.TestSuites.Commands.CreateTestSuite;
using TestCraft.Application.TestSuites.Commands.DeleteTestSuite;
using TestCraft.Application.TestSuites.Commands.UpdateTestSuite;
using TestCraft.Application.TestSuites.Queries.GetTestSuiteById;
using TestCraft.Application.TestSuites.Queries.GetTestSuites;

namespace TestCraft.Api.TestSuites;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites")]
public class TestSuitesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestSuiteResponse>>> GetAll(
        Guid projectId,
        [FromQuery] GetTestSuitesQuery query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));

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
        CreateTestSuiteCommand command,
        CancellationToken cancellationToken
    )
    {
        var suite = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = suite.Id }, suite);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestSuiteResponse>> Update(
        Guid projectId,
        Guid id,
        UpdateTestSuiteCommand command,
        CancellationToken cancellationToken
    )
    {
        if (id != command.Id)
        {
            return BadRequest();
        }

        return Ok(await sender.Send(command with { ProjectId = projectId }, cancellationToken));
    }

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
