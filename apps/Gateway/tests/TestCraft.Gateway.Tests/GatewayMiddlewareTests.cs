using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TestCraft.Gateway.Tests;

public class GatewayMiddlewareTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public GatewayMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(_ => { });
    }

    private HttpClient CreateClient() =>
        _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("https://localhost"),
            }
        );

    [Fact]
    public async Task Get_Keycloak_RedirectsToKeycloakHttpsPort()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/keycloak");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response
            .Headers.Location!.ToString()
            .Should()
            .Be("https://localhost:8443/");
    }

    [Fact]
    public async Task Get_Grafana_RedirectsToGrafanaPath()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/grafana");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response.Headers.Location!.ToString().Should().Be("/grafana/");
    }

    [Fact]
    public async Task Get_Seq_RedirectsToSeqPath()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/seq");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response.Headers.Location!.ToString().Should().Be("/seq/");
    }

    [Theory]
    [InlineData("/.git/config")]
    [InlineData("/.env")]
    [InlineData("/.docker/secrets")]
    public async Task Get_DotfilePath_ReturnsForbidden(string path)
    {
        var client = CreateClient();

        var response = await client.GetAsync(path);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Get_WellKnownPath_IsNotBlockedByDotfileGuard()
    {
        var client = CreateClient();

        var response = await client.GetAsync(
            "/.well-known/openid-configuration"
        );

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Get_HttpRequest_RedirectsToHttps()
    {
        var client = _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("http://localhost"),
            }
        );

        var response = await client.GetAsync("/keycloak");

        response.StatusCode.Should().Be(HttpStatusCode.TemporaryRedirect);
        response.Headers.Location!.Scheme.Should().Be("https");
    }

    [Fact]
    public async Task Get_ApiRoute_IsNotBlockedByDotfileGuardOrRedirects()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/v1/health");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        response.StatusCode.Should().NotBe(HttpStatusCode.MovedPermanently);
    }
}
