using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.RateLimiting;

[Collection(ApiCollection.Name)]
public class RateLimitingTests(ApiFactory factory)
{
    private WebApplicationFactory<Program> Limited(string setting, int limit) =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Staging");
            builder.UseSetting(setting, limit.ToString(CultureInfo.InvariantCulture));
        });

    [Fact]
    public async Task Principal_OverItsLimit_GetsTooManyRequestsWithRetryAfter()
    {
        var client = Limited("RATE_LIMIT_PER_PRINCIPAL", 2).CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            Guid.NewGuid().ToString()
        );

        await client.GetAsync("/api/v1/projects");
        await client.GetAsync("/api/v1/projects");
        var limited = await client.GetAsync("/api/v1/projects");

        limited.StatusCode.Should().Be(HttpStatusCode.TooManyRequests);
        limited.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        limited.Headers.RetryAfter!.Delta.Should().BePositive();
    }

    [Fact]
    public async Task Ip_OverItsLimit_IsRefusedBeforeAuthentication_ButHealthChecksAreNot()
    {
        var anonymous = Limited("RATE_LIMIT_PER_IP", 1).CreateClient();

        (await anonymous.GetAsync("/api/v1/projects"))
            .StatusCode.Should()
            .Be(HttpStatusCode.Unauthorized);
        (await anonymous.GetAsync("/api/v1/projects"))
            .StatusCode.Should()
            .Be(HttpStatusCode.TooManyRequests);
        (await anonymous.GetAsync("/api/health"))
            .StatusCode.Should()
            .NotBe(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task PublicShareLookups_HaveTheirOwnLimit()
    {
        var anonymous = Limited("RATE_LIMIT_SHARE_PER_IP", 1).CreateClient();

        (await anonymous.GetAsync("/api/v1/share/unknown"))
            .StatusCode.Should()
            .Be(HttpStatusCode.NotFound);
        (await anonymous.GetAsync("/api/v1/share/unknown"))
            .StatusCode.Should()
            .Be(HttpStatusCode.TooManyRequests);
    }
}
