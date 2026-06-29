using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Prometheus;
using TestCraft.Api.Configuration;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.System;

#pragma warning disable S6960
[ApiController]
[ApiVersionNeutral]
[Route("api")]
public class SystemController(ApiOptions apiOptions, IApplicationDbContext dbContext)
    : ControllerBase
{
    /// <summary>Gets the Keycloak authority used by clients to authenticate.</summary>
    [HttpGet("auth-config")]
    public ActionResult<AuthConfigResponse> GetAuthConfig() =>
        Ok(new AuthConfigResponse(apiOptions.KeycloakAuthority));

    /// <summary>Returns whether the API process has started.</summary>
    [HttpGet("ready")]
    public ActionResult<StatusResponse> GetReady() => Ok(new StatusResponse("ok"));

    /// <summary>Returns the API's health, including database connectivity.</summary>
    [HttpGet("health")]
    public async Task<ActionResult<StatusResponse>> GetHealth()
    {
        if (await PingDbAsync())
        {
            return Ok(new StatusResponse("healthy"));
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, new StatusResponse("unhealthy"));
    }

    /// <summary>Returns detailed runtime status and diagnostics.</summary>
    [HttpGet("status")]
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
                    HeapTotal: GC.GetTotalMemory(forceFullCollection: false)
                ),
                Db: dbUp ? "up" : "down",
                Version: GetType().Assembly.GetName().Version?.ToString() ?? "unknown",
                Runtime: $".NET {Environment.Version}"
            )
        );
    }

    /// <summary>Returns Prometheus metrics for scraping.</summary>
    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(
        [FromHeader(Name = "Authorization")] string? authorization
    )
    {
        var metricsToken = apiOptions.MetricsToken;
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
            await dbContext.Database.ExecuteSqlRawAsync("SELECT 1");

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool IsBearerTokenValid(string? authHeader, string token)
    {
        var providedBytes = Encoding.UTF8.GetBytes(authHeader ?? string.Empty);
        var expectedBytes = Encoding.UTF8.GetBytes($"Bearer {token}");

        return providedBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
    }
}
#pragma warning restore S6960
