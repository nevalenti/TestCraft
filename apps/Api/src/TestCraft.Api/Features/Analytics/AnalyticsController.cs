using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using TestCraft.Api.Authorization;
using TestCraft.Application.Features.Analytics;

namespace TestCraft.Api.Features.Analytics;

[ApiTokenScope("analytics")]
[Route("api/v{version:apiVersion}/projects/{projectId:guid}/analytics")]
public class AnalyticsController(ISender sender) : ApiControllerBase
{
    /// <summary>Returns pass rate trend over recent test runs.</summary>
    [HttpGet("trend")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TrendPoint>>> GetTrend(
        ProjectId projectId,
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
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SuiteBreakdown>>> GetSuiteBreakdown(
        ProjectId projectId,
        TestRunId runId,
        CancellationToken cancellationToken
    )
    {
        var query = new GetSuiteBreakdown.Query { ProjectId = projectId, RunId = runId };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Returns test cases with inconsistent results across runs (flaky tests).</summary>
    [HttpGet("flaky")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<FlakyTestStat>>> GetFlaky(
        ProjectId projectId,
        [FromQuery] int minRuns = 3,
        [FromQuery] int recentRuns = 200,
        CancellationToken cancellationToken = default
    )
    {
        var query = new GetFlakyTests.Query
        {
            ProjectId = projectId,
            MinRuns = minRuns,
            RecentRuns = recentRuns,
        };

        var result = await sender.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>Compares results between two test runs.</summary>
    [HttpGet("runs/compare")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<RunComparison>> Compare(
        ProjectId projectId,
        [FromQuery, BindRequired] TestRunId runAId,
        [FromQuery, BindRequired] TestRunId runBId,
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
