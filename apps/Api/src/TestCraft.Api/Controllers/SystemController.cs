using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Prometheus;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.Controllers;

[ApiController]
[Route("api")]
public class SystemController(
    IConfiguration configuration,
    AppDbContext dbContext
) : ControllerBase
{
    [HttpGet("auth-config")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetAuthConfig() =>
        Ok(new { authority = configuration["KEYCLOAK_AUTHORITY"] });

    [HttpGet("ready")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public IActionResult GetReady() => Ok(new { status = "ok" });

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth()
    {
        if (await PingDbAsync())
        {
            return Ok(new { status = "healthy" });
        }

        return StatusCode(
            StatusCodes.Status503ServiceUnavailable,
            new { status = "unhealthy" }
        );
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var dbUp = await PingDbAsync();
        var process = Process.GetCurrentProcess();

        return Ok(
            new
            {
                status = dbUp ? "ok" : "degraded",
                uptime = (long)
                    (
                        DateTime.UtcNow - process.StartTime.ToUniversalTime()
                    ).TotalSeconds,
                memory = new
                {
                    rss = process.WorkingSet64,
                    heapUsed = GC.GetTotalMemory(forceFullCollection: false),
                    heapTotal = GC.GetTotalMemory(forceFullCollection: false),
                },
                db = dbUp ? "up" : "down",
                version = GetType().Assembly.GetName().Version?.ToString()
                    ?? "unknown",
                runtime = $".NET {Environment.Version}",
            }
        );
    }

    [HttpGet("metrics")]
    public async Task<IActionResult> GetMetrics(
        [FromHeader(Name = "Authorization")] string? authorization
    )
    {
        var metricsToken = configuration["METRICS_TOKEN"];
        if (
            !string.IsNullOrEmpty(metricsToken)
            && !IsBearerTokenValid(authorization, metricsToken)
        )
        {
            return Unauthorized();
        }

        using var stream = new MemoryStream();
        await Metrics.DefaultRegistry.CollectAndExportAsTextAsync(
            stream,
            HttpContext.RequestAborted
        );

        return File(
            stream.ToArray(),
            "text/plain; version=0.0.4; charset=utf-8"
        );
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
            && CryptographicOperations.FixedTimeEquals(
                providedBytes,
                expectedBytes
            );
    }
}
