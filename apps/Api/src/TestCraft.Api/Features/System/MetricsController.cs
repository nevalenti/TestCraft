using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Prometheus;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Common.Security;

namespace TestCraft.Api.Features.System;

[ApiController]
[ApiVersionNeutral]
[ApiExplorerSettings(IgnoreApi = true)]
[Route("api")]
public class MetricsController(
    IOptions<MetricsOptions> metricsOptions,
    IHostEnvironment hostEnvironment
) : ControllerBase
{
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
