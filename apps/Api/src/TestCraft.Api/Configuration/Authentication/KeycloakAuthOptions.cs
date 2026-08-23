using System.ComponentModel.DataAnnotations;

using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Authentication;

public sealed class KeycloakAuthOptions : IStartupOptions
{
    [Required]
    public string KeycloakAuthority { get; init; } = string.Empty;

    public string? KeycloakIssuer { get; init; }

    public string KeycloakAudience { get; init; } = "testcraft-web";

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
