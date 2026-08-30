using System.ComponentModel.DataAnnotations;

using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Authentication;

public sealed class KeycloakAuthOptions : IStartupOptions
{
    [Required]
    [NotSensitive]
    public string KeycloakAuthority { get; init; } = string.Empty;

    [NotSensitive]
    public string? KeycloakIssuer { get; init; }

    [NotSensitive]
    public string KeycloakAudience { get; init; } = "testcraft-web";

    [NotSensitive]
    public bool KeycloakRequireHttpsMetadata { get; init; } = true;

    public static KeycloakAuthOptions Bind(IConfiguration configuration)
    {
        var options = new KeycloakAuthOptions
        {
            KeycloakAuthority = configuration["KEYCLOAK_AUTHORITY"] ?? string.Empty,
            KeycloakIssuer = configuration["KEYCLOAK_ISSUER"],
            KeycloakAudience = configuration["KEYCLOAK_AUDIENCE"] ?? "testcraft-web",
            KeycloakRequireHttpsMetadata = configuration.GetValue(
                "KEYCLOAK_REQUIRE_HTTPS_METADATA",
                defaultValue: true
            ),
        };

        return OptionsValidator.ValidateAndThrow(options, "Keycloak");
    }
}
