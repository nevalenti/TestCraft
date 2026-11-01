using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using TestCraft.Api.IntegrationTests.Infrastructure;

namespace TestCraft.Api.IntegrationTests.System;

[Collection(ApiCollection.Name)]
public class HangfireDashboardTests(ApiFactory factory)
{
    [Theory]
    [InlineData("Staging", HttpStatusCode.Unauthorized)]
    [InlineData("Development", HttpStatusCode.OK)]
    public async Task Dashboard_IsOpenWithoutCredentialsOnlyInDevelopment(
        string environment,
        HttpStatusCode expected
    )
    {
        await using var instance = factory.WithWebHostBuilder(builder =>
            builder.UseEnvironment(environment)
        );

        var response = await instance.CreateClient().GetAsync("/hangfire");

        response.StatusCode.Should().Be(expected);
    }
}
