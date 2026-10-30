using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Yarp.ReverseProxy;

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
    public async Task Get_Keycloak_RedirectsToAuthSubdomain()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/keycloak");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response
            .Headers.Location!.ToString()
            .Should()
            .Be("https://auth.testcraft.pro/");
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
    public async Task Get_Docs_RedirectsToDocsPath()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/docs");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response.Headers.Location!.ToString().Should().Be("/docs/");
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
    public void RunEventSockets_AreRoutedToTheApi_AheadOfTheWebCatchAll()
    {
        var proxyState =
            _factory.Services.GetRequiredService<IProxyStateLookup>();

        proxyState.TryGetRoute("api-ws", out var socketRoute).Should().BeTrue();
        proxyState.TryGetRoute("web", out var webRoute).Should().BeTrue();

        socketRoute!.Config.ClusterId.Should().Be("api");
        socketRoute.Config.Match.Path.Should().Be("/ws/{**catch-all}");
        socketRoute
            .Config.Order.Should()
            .BeLessThan(webRoute!.Config.Order ?? 0);
    }

    [Fact]
    public void ApiRequests_AreRoutedToTheApi_AheadOfTheWebCatchAll()
    {
        var proxyState =
            _factory.Services.GetRequiredService<IProxyStateLookup>();

        proxyState.TryGetRoute("api", out var apiRoute).Should().BeTrue();
        proxyState.TryGetRoute("web", out var webRoute).Should().BeTrue();

        apiRoute!.Config.ClusterId.Should().Be("api");
        apiRoute.Config.Match.Path.Should().Be("/api/{**catch-all}");
        apiRoute.Config.Order.Should().BeLessThan(webRoute!.Config.Order ?? 0);
        proxyState.TryGetCluster("api", out var cluster).Should().BeTrue();
        cluster!
            .Destinations.Values.Single()
            .Model.Config.Address.Should()
            .Be("http://api:8080");
    }

    [Fact]
    public async Task Get_ApiRoute_IsNotBlockedByDotfileGuardOrRedirects()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/v1/health");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        response.StatusCode.Should().NotBe(HttpStatusCode.MovedPermanently);
    }

    [Fact]
    public async Task Get_Healthz_OverHttp_ReturnsOkWithoutRedirect()
    {
        var client = _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("http://localhost"),
            }
        );

        var response = await client.GetAsync("/healthz");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Get_HttpsRequest_SetsHstsAndOmitsServerHeader()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/healthz");

        response
            .Headers.GetValues("Strict-Transport-Security")
            .Should()
            .ContainSingle("max-age=15552000; includeSubDomains");
        response.Headers.Contains("Server").Should().BeFalse();
    }

    [Fact]
    public async Task Get_HttpRequest_DoesNotSetHsts()
    {
        var client = _factory.CreateClient(
            new WebApplicationFactoryClientOptions
            {
                AllowAutoRedirect = false,
                BaseAddress = new Uri("http://localhost"),
            }
        );

        var response = await client.GetAsync("/healthz");

        response
            .Headers.Contains("Strict-Transport-Security")
            .Should()
            .BeFalse();
    }
}
