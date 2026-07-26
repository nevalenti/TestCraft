using System.Net;
using System.Net.Http.Headers;
using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace TestCraft.Gateway.Tests;

public class GatewayMiddlewareTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public GatewayMiddlewareTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(_ => { });
    }

    private HttpClient CreateClient() => CreateClient(_factory);

    private static HttpClient CreateClient(
        WebApplicationFactory<Program> factory
    ) =>
        factory.CreateClient(
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
    public async Task Get_Seq_RedirectsToSeqPath()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/seq");

        response.StatusCode.Should().Be(HttpStatusCode.MovedPermanently);
        response.Headers.Location!.ToString().Should().Be("/seq/");
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
    public async Task Get_ApiRoute_IsNotBlockedByDotfileGuardOrRedirects()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/v1/health");

        response.StatusCode.Should().NotBe(HttpStatusCode.Forbidden);
        response.StatusCode.Should().NotBe(HttpStatusCode.MovedPermanently);
    }

    [Fact]
    public async Task Get_SeqSubPath_WithoutCredentials_ReturnsUnauthorized()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/seq/");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_SeqSubPath_WithWrongCredentials_ReturnsUnauthorized()
    {
        var factory = WithSeqBasicAuthConfigured();
        var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = BasicAuthHeader(
            "admin",
            "wrong-password"
        );

        var response = await client.GetAsync("/seq/");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Get_SeqSubPath_WithCorrectCredentials_IsNotUnauthorized()
    {
        var factory = WithSeqBasicAuthConfigured();
        var client = CreateClient(factory);
        client.DefaultRequestHeaders.Authorization = BasicAuthHeader(
            "admin",
            "correct-password"
        );

        var response = await client.GetAsync("/seq/");

        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }

    private WebApplicationFactory<Program> WithSeqBasicAuthConfigured() =>
        _factory.WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration(
                (_, config) =>
                    config.AddInMemoryCollection(
                        new Dictionary<string, string?>
                        {
                            ["SEQ_BASIC_AUTH_USERNAME"] = "admin",
                            ["SEQ_BASIC_AUTH_PASSWORD"] = "correct-password",
                        }
                    )
            )
        );

    private static AuthenticationHeaderValue BasicAuthHeader(
        string username,
        string password
    ) =>
        new(
            "Basic",
            Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{username}:{password}")
            )
        );
}
