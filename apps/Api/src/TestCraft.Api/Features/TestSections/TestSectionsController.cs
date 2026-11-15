using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Application.Features.TestSections;

namespace TestCraft.Api.Features.TestSections;

[ApiTokenScope("cases")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites/{suiteId:guid}/sections")]
public class TestSectionsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists every section of a suite.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TestSectionResponse>>> GetAll(
        ProjectId projectId,
        TestSuiteId suiteId,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestSections.Query { ProjectId = projectId, SuiteId = suiteId },
                cancellationToken
            )
        );

    /// <summary>Gets a section by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestSectionResponse>> GetById(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestSectionId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                new GetTestSectionById.Query
                {
                    ProjectId = projectId,
                    SuiteId = suiteId,
                    Id = id,
                },
                cancellationToken
            )
        );

    /// <summary>Creates a section in a suite.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestSectionResponse>> Create(
        ProjectId projectId,
        TestSuiteId suiteId,
        CreateTestSection.Command command,
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

    /// <summary>Sets the position of several sections.</summary>
    [HttpPut("order")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reorder(
        ProjectId projectId,
        TestSuiteId suiteId,
        ReorderTestSections.Command command,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            command with
            {
                ProjectId = projectId,
                SuiteId = suiteId,
            },
            cancellationToken
        );

        return NoContent();
    }

    /// <summary>Renames a section or changes its description.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestSectionResponse>> Update(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestSectionId id,
        UpdateTestSection.Command command,
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

    /// <summary>Moves a section under another parent.</summary>
    [HttpPost("{id:guid}/move")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestSectionResponse>> Move(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestSectionId id,
        MoveTestSection.Command command,
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

    /// <summary>Deletes a section with its subsections and test cases.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestSuiteId suiteId,
        TestSectionId id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestSection.Command
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
