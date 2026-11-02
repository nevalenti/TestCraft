using System.Diagnostics;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Prometheus;
using TestCraft.Api.Configuration.Authentication;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Common.Security;

namespace TestCraft.Api.Features.System;

#pragma warning disable S6960
[ApiController]
[ApiVersionNeutral]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("api")]
public class SystemController(
    IOptions<KeycloakAuthOptions> keycloakOptions,
    IOptions<MetricsOptions> metricsOptions,
    HealthCheckService healthChecks,
    TimeProvider timeProvider,
    IHostEnvironment hostEnvironment
) : ControllerBase
{
    /// <summary>Gets the Keycloak authority used by clients to authenticate.</summary>
    [HttpGet("auth-config")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<AuthConfigResponse> GetAuthConfig()
    {
        return Ok(new AuthConfigResponse(keycloakOptions.Value.KeycloakAuthority));
    }

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

    /// <summary>Returns Prometheus metrics for scraping.</summary>
    [HttpGet("metrics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMetrics(
        [FromHeader(Name = "Authorization")] string? authorization
    )
    {
        var metricsToken = metricsOptions.Value.MetricsToken;
        if (
            string.IsNullOrEmpty(metricsToken)
                ? !hostEnvironment.IsDevelopment()
                : !IsBearerTokenValid(authorization, metricsToken)
        )
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

    private static bool IsBearerTokenValid(string? authHeader, string token)
    {
        return FixedTimeCredentialComparer.Equals(authHeader ?? string.Empty, $"Bearer {token}");
    }
}
#pragma warning restore S6960
