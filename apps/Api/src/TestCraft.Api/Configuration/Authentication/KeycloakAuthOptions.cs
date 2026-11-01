using System.ComponentModel.DataAnnotations;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Authentication;

public sealed class KeycloakAuthOptions : IStartupOptions
{
    [Required]
    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_AUTHORITY")]
    public string KeycloakAuthority { get; set; } = string.Empty;

    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_ISSUER")]
    public string? KeycloakIssuer { get; set; }

    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_AUDIENCE")]
    public string KeycloakAudience { get; set; } = "testcraft-web";

    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_REQUIRE_HTTPS_METADATA")]
    public bool KeycloakRequireHttpsMetadata { get; set; } = true;

    [NotSensitive]
    [ConfigurationKeyName("KEYCLOAK_AUTHORIZED_PARTIES")]
    public string KeycloakAuthorizedParties { get; set; } = "testcraft-web,testcraft-ci";

    [NotSensitive]
    public string ValidIssuer =>
        string.IsNullOrEmpty(KeycloakIssuer) ? KeycloakAuthority : KeycloakIssuer;

    [NotSensitive]
    public IReadOnlyList<string> AuthorizedParties =>
        KeycloakAuthorizedParties.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        );
}
