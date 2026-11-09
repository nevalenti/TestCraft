using System.Diagnostics;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using TestCraft.Api.Configuration.Observability;

namespace TestCraft.Api.Features.System;

[ApiController]
[ApiVersionNeutral]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("api")]
public class SystemController(HealthCheckService healthChecks, TimeProvider timeProvider)
    : ControllerBase
{
    /// <summary>Returns detailed runtime status and diagnostics.</summary>
    [HttpGet("status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemStatusResponse>> GetStatus()
    {
        var database = await healthChecks.CheckHealthAsync(
            check => check.Name == HealthCheckExtensions.DatabaseCheckName,
            HttpContext.RequestAborted
        );
        var dbUp = database.Status == HealthStatus.Healthy;
        using var process = Process.GetCurrentProcess();

        return Ok(
            new SystemStatusResponse(
                Status: dbUp ? "ok" : "degraded",
                Uptime: (long)
                    (timeProvider.GetUtcNow() - process.StartTime.ToUniversalTime()).TotalSeconds,
                Memory: new MemoryUsageResponse(
                    Rss: process.WorkingSet64,
                    HeapUsed: GC.GetTotalMemory(forceFullCollection: false),
                    HeapTotal: GC.GetGCMemoryInfo().TotalCommittedBytes
                ),
                Db: dbUp ? "up" : "down",
                Version: GetType().Assembly.GetName().Version?.ToString() ?? "unknown",
                Runtime: $".NET {Environment.Version}"
            )
        );
    }
}
