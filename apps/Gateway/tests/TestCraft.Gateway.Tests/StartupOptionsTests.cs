using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TestCraft.Gateway.Configuration;

namespace TestCraft.Gateway.Tests;

public class StartupOptionsTests
{
    [Fact]
    public void ValidSettings_AreBound()
    {
        var options = Add(
            ("OTEL_TRACES_SAMPLER_ARG", "0.25"),
            ("RELEASE", "1.2.3")
        );

        options.TraceSampleRatio.Should().Be(0.25);
        options.Release.Should().Be("1.2.3");
        options.ServiceName.Should().Be("testcraft-gateway");
    }

    [Fact]
    public void MalformedValue_FailsInsteadOfFallingBack()
    {
        var act = () => Add(("OTEL_TRACES_SAMPLER_ARG", "abc"));

        act.Should()
            .Throw<InvalidOperationException>()
            .WithMessage("*OTEL_TRACES_SAMPLER_ARG*");
    }

    [Fact]
    public void OutOfRangeValue_FailsValidation()
    {
        var act = () => Add(("OTEL_TRACES_SAMPLER_ARG", "2"));

        act.Should()
            .Throw<OptionsValidationException>()
            .WithMessage("*TraceSampleRatio*");
    }

    private static GatewayLoggingOptions Add(
        params (string Key, string Value)[] values
    ) =>
        new ServiceCollection().AddStartupOptions<GatewayLoggingOptions>(
            new ConfigurationBuilder()
                .AddInMemoryCollection(
                    values.Select(v => new KeyValuePair<string, string?>(
                        v.Key,
                        v.Value
                    ))
                )
                .Build()
        );
}
