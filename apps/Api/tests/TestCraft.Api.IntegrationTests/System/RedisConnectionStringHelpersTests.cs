using FluentAssertions;
using TestCraft.Infrastructure.Caching;

namespace TestCraft.Api.IntegrationTests.System;

public class RedisConnectionStringHelpersTests
{
    [Fact]
    public void Url_SelectsTheDatabaseInItsPath()
    {
        var options = RedisConnectionStringHelpers.ToRedisConfigurationOptions(
            "redis://:s3cret@cache:6380/1"
        );

        options.DefaultDatabase.Should().Be(1);
        options.Password.Should().Be("s3cret");
        options
            .EndPoints.Should()
            .ContainSingle()
            .Which.ToString()
            .Should()
            .Be("Unspecified/cache:6380");
    }

    [Fact]
    public void Url_WithoutAPath_UsesTheDefaultDatabase()
    {
        RedisConnectionStringHelpers
            .ToRedisConfigurationOptions("redis://cache")
            .DefaultDatabase.Should()
            .BeNull();
    }
}
