using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.TestCases;

namespace TestCraft.Api.TestCases;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases")]
public class TestCasesController(ISender sender) : ControllerBase
{
    /// <summary>Lists test cases in a suite, optionally filtered by name.</summary>
    [HttpGet]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        Guid projectId,
        Guid suiteId,
        [FromQuery] GetTestCases.Query query,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                query with
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                },
                cancellationToken
            )
        );

    /// <summary>Gets a test case by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestCaseResponse>> GetById(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestCaseById.Query
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                },
                cancellationToken
            )
        );

    /// <summary>Creates a new test case in a suite.</summary>
    [HttpPost]
    public async Task<ActionResult<TestCaseResponse>> Create(
        Guid projectId,
        Guid suiteId,
        CreateTestCase.Command command,
        CancellationToken cancellationToken
    )
    {
        var testCase = await sender.Send(
            command with
            {
                ProjectId = projectId,
                SuiteId = suiteId,
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

    /// <summary>Updates a test case's details.</summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TestCaseResponse>> Update(
        Guid projectId,
        Guid suiteId,
        Guid id,
        UpdateTestCase.Command command,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                },
                cancellationToken
            )
        );

    /// <summary>Deletes a test case.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid projectId,
        Guid suiteId,
        Guid id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestCase.Command
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
