using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TestCraft.Api.Configuration.Proxy;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.IntegrationTests.System;

public class StartupOptionsTests
{
    [Fact]
    public void ValidSettings_AreBound()
    {
        Add(("SMTP_PORT", "2525")).SmtpPort.Should().Be(2525);
    }

    [Fact]
    public void MalformedValue_FailsInsteadOfFallingBack()
    {
        var act = () => Add(("SMTP_PORT", "abc"));

        act.Should().Throw<InvalidOperationException>().WithMessage("*SMTP_PORT*");
    }

    [Fact]
    public void OutOfRangeValue_FailsValidation()
    {
        var act = () => Add(("SMTP_PORT", "0"));

        act.Should().Throw<OptionsValidationException>().WithMessage("*SmtpPort*");
    }

    [Fact]
    public void KnownProxyNetworks_AreParsedAsCidrs()
    {
        var options = new ServiceCollection().AddStartupOptions<ProxyOptions>(
            Configuration(("KNOWN_PROXY_NETWORKS", "10.42.0.0/16, fd00::/8"))
        );

        options
            .Networks.Select(network => network.ToString())
            .Should()
            .Equal("10.42.0.0/16", "fd00::/8");
    }

    [Fact]
    public void KnownProxyNetworks_RejectAnAddressThatIsNotACidr()
    {
        var act = () =>
            new ServiceCollection().AddStartupOptions<ProxyOptions>(
                Configuration(("KNOWN_PROXY_NETWORKS", "gateway"))
            );

        act.Should().Throw<OptionsValidationException>().WithMessage("*'gateway'*");
    }

    private static IConfiguration Configuration(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                values.Select(v => new KeyValuePair<string, string?>(v.Key, v.Value))
            )
            .Build();

    private static InfrastructureOptions Add(params (string Key, string Value)[] values) =>
        new ServiceCollection().AddStartupOptions<InfrastructureOptions>(
            Configuration([
                ("DATABASE_URL", "postgresql://app@db/testcraft"),
                ("KEYCLOAK_AUTHORITY", "http://keycloak/realms/testcraft"),
                ("KEYCLOAK_ADMIN_CLIENT_ID", "admin"),
                ("KEYCLOAK_ADMIN_CLIENT_SECRET", "secret"),
                .. values,
            ])
        );
}
