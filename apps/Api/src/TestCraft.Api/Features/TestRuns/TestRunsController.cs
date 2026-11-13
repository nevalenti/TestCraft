using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.OutputCaching;
using TestCraft.Api.Authorization;
using TestCraft.Api.Configuration.OutputCaching;
using TestCraft.Api.Idempotency;
using TestCraft.Api.Realtime;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.Features.TestRuns;

[ApiTokenScope("runs")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/runs")]
public class TestRunsController(ISender sender) : ApiControllerBase
{
    /// <summary>Lists test runs for a project, optionally filtered by name.</summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Paginated<TestRunResponse>>> GetAll(
        ProjectId projectId,
        [FromQuery] GetTestRuns.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId }, cancellationToken));

    /// <summary>Gets a test run by ID.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TestRunResponse>> GetById(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    ) =>
        OkWithETag(
            await sender.Send(
                new GetTestRunById.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Gets the result counts (passed/failed/skipped/etc.) for a test run.</summary>
    [HttpGet("{id:guid}/summary")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<GetTestRunSummary.Response>> GetSummary(
        ProjectId projectId,
        TestRunId id,
        CancellationToken cancellationToken
    ) =>
        Ok(
            await sender.Send(
                new GetTestRunSummary.Query { ProjectId = projectId, Id = id },
                cancellationToken
            )
        );

    /// <summary>Creates a new test run.</summary>
    [HttpPost]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestRunResponse>> Create(
        ProjectId projectId,
        CreateTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(command with { ProjectId = projectId }, cancellationToken);

        return CreatedWithETag(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>
    /// Creates a new run with an untested result for each case in an existing run, or only for
    /// the cases that currently failed or are blocked.
    /// </summary>
    [HttpPost("{id:guid}/rerun")]
    [Idempotent]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<TestRunResponse>> Rerun(
        ProjectId projectId,
        TestRunId id,
        RerunTestRun.Command command,
        CancellationToken cancellationToken
    )
    {
        var result = await sender.Send(
            command with
            {
                ProjectId = projectId,
                Id = id,
            },
            cancellationToken
        );

        return CreatedWithETag(nameof(GetById), new { projectId, id = result.Id }, result);
    }

    /// <summary>Updates a test run's name, environment, and status.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status412PreconditionFailed)]
    public async Task<ActionResult<TestRunResponse>> Update(
        ProjectId projectId,
        TestRunId id,
        UpdateTestRun.Command command,
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

    /// <summary>
    /// Gets up to <c>limit</c> of the newest log lines, oldest first. To page back, pass the
    /// <c>seq</c> of the first line received as <c>before_seq</c>.
    /// </summary>
    [HttpGet("{id:guid}/logs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<RunLogPageResponse>> GetLogs(
        ProjectId projectId,
        TestRunId id,
        [FromQuery] GetRunLogs.Query query,
        CancellationToken cancellationToken
    ) => Ok(await sender.Send(query with { ProjectId = projectId, RunId = id }, cancellationToken));

    /// <summary>Appends log lines to the live feed for a test run.</summary>
    [HttpPost("{id:guid}/logs")]
    [Idempotent]
    [RequestSizeLimit(10_500_000)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> AppendLogs(
        ProjectId projectId,
        TestRunId id,
        AppendRunLogs.Command command,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(command with { ProjectId = projectId, RunId = id }, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Issues a single-use ticket for the run's WebSocket, <c>/ws/runs/{runId}?ticket=</c>;
    /// connect within 30 seconds. Signed-in users only, from the viewer role up.
    /// </summary>
    [HttpPost("{id:guid}/ws-ticket")]
    [ProjectRoles(Write = ProjectRole.Viewer)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<SocketTicketResponse>> CreateSocketTicket(
        ProjectId projectId,
        TestRunId id,
        [FromServices] SocketTickets tickets,
        [FromServices] ICurrentUser currentUser,
        CancellationToken cancellationToken
    )
    {
        var expiresAt = SignedInSession.ExpiresAt(User);

        await sender.Send(
            new GetTestRunById.Query { ProjectId = projectId, Id = id },
            cancellationToken
        );

        return Ok(
            new SocketTicketResponse
            {
                Ticket = await tickets.IssueForRunAsync(currentUser.UserId, id, expiresAt),
            }
        );
    }

    /// <summary>Deletes a test run.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        ProjectId projectId,
        TestRunId id,
        [FromServices] IOutputCacheStore cacheStore,
        CancellationToken cancellationToken
    )
    {
        await sender.Send(
            new DeleteTestRun.Command { ProjectId = projectId, Id = id },
            cancellationToken
        );

        await cacheStore.EvictPublicSharesAsync(cancellationToken);

        return NoContent();
    }
}
