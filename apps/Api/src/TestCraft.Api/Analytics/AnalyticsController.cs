using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestCraft.Application.Analytics;

namespace TestCraft.Api.Analytics;

[Authorize]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/analytics")]
public class AnalyticsController(ISender sender) : ControllerBase
{
    /// <summary>Returns pass rate trend over recent test runs.</summary>
    [HttpGet("trend")]
    [ProducesResponseType(typeof(IReadOnlyList<TrendPoint>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TrendPoint>>> GetTrend(
        Guid projectId,
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetRunTrend.Query { ProjectId = projectId, Limit = limit };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Returns result counts grouped by suite for a test run.</summary>
    [HttpGet("runs/{runId:guid}/suite-breakdown")]
    [ProducesResponseType(typeof(IReadOnlyList<SuiteBreakdown>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SuiteBreakdown>>> GetSuiteBreakdown(
        Guid projectId,
        Guid runId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetSuiteBreakdown.Query { ProjectId = projectId, RunId = runId };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Returns test cases with inconsistent results across runs (flaky tests).</summary>
    [HttpGet("flaky")]
    [ProducesResponseType(typeof(IReadOnlyList<FlakyTestStat>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FlakyTestStat>>> GetFlaky(
        Guid projectId,
        [FromQuery] int minRuns = 3,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetFlakyTests.Query { ProjectId = projectId, MinRuns = minRuns };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Compares results between two test runs.</summary>
    [HttpGet("runs/compare")]
    [ProducesResponseType(typeof(RunComparison), StatusCodes.Status200OK)]
    public async Task<ActionResult<RunComparison>> Compare(
        Guid projectId,
        [FromQuery] Guid runAId,
        [FromQuery] Guid runBId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetRunComparison.Query
        {
            ProjectId = projectId,
            RunAId = runAId,
            RunBId = runBId,
        };
        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }
}
