using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Api.System;

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
}
