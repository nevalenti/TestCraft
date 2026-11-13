using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Api.Idempotency;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestSuites;
using TestCraft.Domain.Enums;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Features.TestSuites;

[ApiTokenScope("suites")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/suites")]
public class TestSuitesController(ISender sender, ProjectAccess projectAccess) : ApiControllerBase
{
    /// <summary>Lists test suites for a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestSuiteResponse>>> GetAll(
        ProjectId projectId,
        [FromQuery] GetTestSuites.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));

    /// <summary>Gets a test suite by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestSuiteResponse>> GetById(
        ProjectId projectId,
        TestSuiteId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                new GetTestSuiteById.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Creates a new test suite.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestSuiteResponse>> Create(
        ProjectId projectId,
        CreateTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Copies a suite, with its test cases, into the same or another project.</summary>
    [HttpPost("{id:guid}/clone")]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestSuiteResponse>> Clone(
        ProjectId projectId,
        TestSuiteId id,
        CloneTestSuite.Command command,
        CancellationToken cancellationToken
    )
    {
        if (command.TargetProjectId is { } target && target != projectId)
        {
            await EnsureCanCopyIntoAsync(target, cancellationToken);
        }

        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                Id = id,
            },
            cancellationToken
        );

        return CreatedAtAction(
            nameof(GetById),
            new { projectId = result.ProjectId, id = result.Id },
            result
        );
    }

    /// <summary>Updates a test suite's details.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestSuiteResponse>> Update(
        ProjectId projectId,
        TestSuiteId id,
        UpdateTestSuite.Command command,
        [FromHeader(Name = "If-Match"), BindRequired] string ifMatch,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                command with
                {
                    ProjectId = projectId,
                    Id = id,
                    ExpectedVersion = ExpectedVersion(ifMatch),
                },
                cancellationToken
            )
        );

    /// <summary>Deletes a test suite.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestSuiteId id,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestSuite.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return NoContent();
    }

    private async Task EnsureCanCopyIntoAsync(
        ProjectId targetProjectId,
        CancellationToken cancellationToken
    )
    {
        if (User.IsApiToken())
        {
            throw new ForbiddenException("API tokens cannot copy into another project");
        }

        var role =
            await projectAccess.RoleOfAsync(targetProjectId, cancellationToken)
            ?? throw new NotFoundException();
        if (!role.HasAtLeast(ProjectRole.Editor))
        {
            throw new ForbiddenException("You need the editor role in the target project");
        }
    }
}
