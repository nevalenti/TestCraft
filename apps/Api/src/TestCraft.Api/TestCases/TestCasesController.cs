using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.TestCases;
using TestCraft.Application.TestCases.Commands.CreateTestCase;
using TestCraft.Application.TestCases.Commands.DeleteTestCase;
using TestCraft.Application.TestCases.Commands.UpdateTestCase;
using TestCraft.Application.TestCases.Queries.GetTestCaseById;
using TestCraft.Application.TestCases.Queries.GetTestCases;
using TestCraft.Domain.Pagination;

namespace TestCraft.Api.TestCases;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases")]
public class TestCasesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        Guid suiteId,
        [FromQuery] TestCaseQuery query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCasesQuery
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Search = query.Search,
                    Pagination = query.ToPaginationParams(),
                },
                cancellationToken
            )
        );

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestCaseResponse>> GetById(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCaseByIdQuery
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                },
                cancellationToken
            )
        );

    [HttpPost]
    public async Task<ActionResult<TestCaseResponse>> Create(
        Guid projectId,
        Guid suiteId,
        CreateTestCaseRequest request,
        CancellationToken cancellationToken
    )
    {
        var testCase = await sender.Send(
            new CreateTestCaseCommand
            {
                ProjectId = projectId,
                SuiteId = suiteId,
                Name = request.Name,
                Description = request.Description,
                Priority = request.Priority,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                suiteId,
                id = testCase.Id,
            },
            testCase
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestCaseResponse>> Update(
        Guid projectId,
        Guid suiteId,
        Guid id,
        UpdateTestCaseRequest request,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new UpdateTestCaseCommand
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                    Name = request.Name,
                    Description = request.Description,
                    Priority = request.Priority,
                },
                cancellationToken
            )
        );

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestCaseCommand
            {
                ProjectId = projectId,
                SuiteId = suiteId,
                Id = id,
            },
            cancellationToken
        );

        return NoContent();
    }
}
