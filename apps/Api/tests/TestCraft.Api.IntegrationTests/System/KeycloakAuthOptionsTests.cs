using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TestCraft.Api.Configuration.Authentication;

namespace TestCraft.Api.IntegrationTests.System;

public class KeycloakAuthOptionsTests
{
    private static KeycloakAuthOptions Bind(params (string Key, string Value)[] values) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(
                values
                    .Select(v => new KeyValuePair<string, string?>(v.Key, v.Value))
                    .Append(new("KEYCLOAK_AUTHORITY", "http://keycloak/realms/testcraft"))
            )
            .Build()
            .Get<KeycloakAuthOptions>()!;

    [Fact]
    public void BlankIssuer_IsTreatedAsUnset()
    {
        Bind(("KEYCLOAK_ISSUER", "")).ValidIssuer.Should().Be("http://keycloak/realms/testcraft");
    }

    [Fact]
    public void AuthorizedParties_DefaultToWebAndCi()
    {
        Bind().AuthorizedParties.Should().Equal("testcraft-web", "testcraft-ci");
    }

    [Fact]
    public void AuthorizedParties_AreTrimmedAndSkipBlanks()
    {
        Bind(("KEYCLOAK_AUTHORIZED_PARTIES", " web , ,ci "))
            .AuthorizedParties.Should()
            .Equal("web", "ci");
    }
}
