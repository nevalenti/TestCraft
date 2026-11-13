using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestCases;

namespace TestCraft.Api.Features.TestCases;

[ApiTokenScope("cases")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/cases")]
public class TestCasesController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists test cases in a suite, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestCaseResponse>>> GetAll(
        ProjectId projectId,
        TestSuiteId suiteId,
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestCaseResponse>> GetById(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
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
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestCaseResponse>> Create(
        ProjectId projectId,
        TestSuiteId suiteId,
        CreateTestCase.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
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
                id = result.Id,
            },
            result
        );
    }

    /// <summary>Copies a test case, with its steps and labels, into the same or another suite.</summary>
    [HttpPost("{id:guid}/clone")]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestCaseResponse>> Clone(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId id,
        CloneTestCase.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                SuiteId = suiteId,
                Id = id,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                projectId,
                suiteId = result.SuiteId,
                id = result.Id,
            },
            result
        );
    }

    /// <summary>Updates a test case's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestCaseResponse>> Update(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId id,
        UpdateTestCase.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                    ExpectedVersion = ExpectedVersion(ifMatch),
                },
                cancellationToken
            )
        );

    /// <summary>Deletes a test case.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestCaseId id,
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
