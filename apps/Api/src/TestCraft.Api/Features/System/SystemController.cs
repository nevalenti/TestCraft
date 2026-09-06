using System.Diagnostics;

using Asp.Versioning;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Prometheus;

using TestCraft.Api.Configuration.Authentication;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Common.Security;

namespace TestCraft.Api.Features.System;

#pragma warning disable S6960
[ApiController]
[ApiVersionNeutral]
[Route("api")]
public partial class SystemController(
    KeycloakAuthOptions keycloakOptions,
    MetricsOptions metricsOptions,
    IApplicationDbContext dbContext,
    ILogger<SystemController> logger
) : ControllerBase
{
    /// <summary>Gets the Keycloak authority used by clients to authenticate.</summary>
    [HttpGet("auth-config")]
    [ProducesResponseType(typeof(AuthConfigResponse), StatusCodes.Status200OK)]
    public ActionResult<AuthConfigResponse> GetAuthConfig()
    {
        return Ok(new AuthConfigResponse(keycloakOptions.KeycloakAuthority));
    }

    /// <summary>Returns detailed runtime status and diagnostics.</summary>
    [HttpGet("status")]
    [ProducesResponseType(typeof(SystemStatusResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<SystemStatusResponse>> GetStatus()
    {
        var dbUp = await PingDbAsync();
        var process = Process.GetCurrentProcess();

        return Ok(
            new SystemStatusResponse(
                Status: dbUp ? "ok" : "degraded",
                Uptime: (long)(DateTime.UtcNow - process.StartTime.ToUniversalTime()).TotalSeconds,
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

    /// <summary>Returns Prometheus metrics for scraping.</summary>
    [HttpGet("metrics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMetrics(
        [FromHeader(Name = "Authorization")] string? authorization
    )
    {
        var metricsToken = metricsOptions.MetricsToken;
        if (!string.IsNullOrEmpty(metricsToken) && !IsBearerTokenValid(authorization, metricsToken))
        {
            return Unauthorized();
        }

        Response.ContentType = "text/plain; version=0.0.4; charset=utf-8";
        await Metrics.DefaultRegistry.CollectAndExportAsTextAsync(
            Response.Body,
            HttpContext.RequestAborted
        );

        return new EmptyResult();
    }

    private async Task<bool> PingDbAsync()
    {
        try
        {
            return await dbContext.Database.CanConnectAsync();
        }
        catch (Exception exception)
        {
            LogDatabaseConnectivityCheckFailed(logger, exception);

            return false;
        }
    }

    private static bool IsBearerTokenValid(string? authHeader, string token)
    {
        return FixedTimeCredentialComparer.Equals(authHeader ?? string.Empty, $"Bearer {token}");
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Database connectivity check failed")]
    private static partial void LogDatabaseConnectivityCheckFailed(
        ILogger logger,
        Exception exception
    );
}
#pragma warning restore S6960
