using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using TestCraft.Api.Features.System;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.System;

[Collection(ApiCollection.Name)]
public class SystemApiTests(ApiFactory factory)
{
    [Fact]
    public async Task GetReady_ReturnsOkWithStatusOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/ready");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<StatusResponse>(
            ApiTestHelpers.JsonOptions
        );
        body!.Status.Should().Be("ok");
    }

    [Fact]
    public async Task GetHealth_DatabaseUp_ReturnsHealthyStatus()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<StatusResponse>(
            ApiTestHelpers.JsonOptions
        );
        body!.Status.Should().Be("healthy");
    }

    [Fact]
    public async Task GetStatus_DatabaseUp_ReturnsOkStatusWithRuntimeInfo()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/status");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<SystemStatusResponse>(
            ApiTestHelpers.JsonOptions
        );
        body!.Status.Should().Be("ok");
        body.Db.Should().Be("up");
        body.Version.Should().NotBeNullOrEmpty();
        body.Runtime.Should().StartWith(".NET");
        body.Uptime.Should().BeGreaterThanOrEqualTo(0);
        body.Memory.Should().NotBeNull();
        body.Memory.Rss.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task GetAuthConfig_ReturnsNonEmptyAuthority()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth-config");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<AuthConfigResponse>(
            ApiTestHelpers.JsonOptions
        );
        body!.Authority.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task GetMetrics_NoTokenConfigured_ReturnsPrometheusText()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/plain");
    }

    private HttpClient CreateClientWithMetricsToken(string token)
    {
        Environment.SetEnvironmentVariable("METRICS_TOKEN", token);
        try
        {
            var tokenFactory = factory.WithWebHostBuilder(_ => { });
            return tokenFactory.CreateClient();
        }
        finally
        {
            Environment.SetEnvironmentVariable("METRICS_TOKEN", null);
        }
    }

    [Fact]
    public async Task GetMetrics_TokenConfigured_WithoutAuth_ReturnsUnauthorized()
    {
        var client = CreateClientWithMetricsToken("secret-token");

        var response = await client.GetAsync("/api/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMetrics_TokenConfigured_WithWrongToken_ReturnsUnauthorized()
    {
        var client = CreateClientWithMetricsToken("secret-token");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            "wrong-token"
        );

        var response = await client.GetAsync("/api/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMetrics_TokenConfigured_WithCorrectToken_ReturnsPrometheusText()
    {
        var client = CreateClientWithMetricsToken("secret-token");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            "secret-token"
        );

        var response = await client.GetAsync("/api/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/plain");
    }
}
