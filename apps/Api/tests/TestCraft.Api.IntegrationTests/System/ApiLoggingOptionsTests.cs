using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TestCraft.Api.Configuration.Observability;

namespace TestCraft.Api.IntegrationTests.System;

public class ApiLoggingOptionsTests
{
    [Fact]
    public void Defaults_DropOnlyTheUsername()
    {
        Bind([]).ExcludedLogProperties.Should().Equal("username");
    }

    [Fact]
    public void UserIdOff_AlsoDropsTheUsername()
    {
        Bind(new() { ["LOG_USER_ID"] = "false", ["LOG_USERNAME"] = "true" })
            .ExcludedLogProperties.Should()
            .Equal("userId", "username");
    }

    private static ApiLoggingOptions Bind(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build().Get<ApiLoggingOptions>()
        ?? new ApiLoggingOptions();
}
