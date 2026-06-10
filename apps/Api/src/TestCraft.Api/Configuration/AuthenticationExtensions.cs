using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class AuthenticationExtensions
{
    public static WebApplicationBuilder AddKeycloakAuthentication(
        this WebApplicationBuilder builder
    )
    {
        var keycloakAuthority =
            builder.Configuration["KEYCLOAK_AUTHORITY"]
            ?? throw new InvalidOperationException(
                "KEYCLOAK_AUTHORITY is not configured"
            );
        var keycloakAudience =
            builder.Configuration["KEYCLOAK_AUDIENCE"] ?? "testcraft-web";
        var requireHttpsMetadata =
            builder.Configuration["KEYCLOAK_REQUIRE_HTTPS_METADATA"] != "false";

        builder
            .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakAuthority;
                options.Audience = keycloakAudience;
                options.RequireHttpsMetadata = requireHttpsMetadata;

                options.ConfigurationManager =
                    new ConfigurationManager<OpenIdConnectConfiguration>(
                        $"{keycloakAuthority}/protocol/openid-connect/certs",
                        new JwksOnlyConfigurationRetriever(),
                        new HttpDocumentRetriever
                        {
                            RequireHttps = requireHttpsMetadata,
                        }
                    );
                options.TokenValidationParameters.ValidateIssuer = false;

                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        await ProblemWriter.WriteAsync(
                            context.HttpContext,
                            Problems.Unauthorized()
                        );
                    },
                    OnForbidden = async context =>
                        await ProblemWriter.WriteAsync(
                            context.HttpContext,
                            Problems.Forbidden()
                        ),
                };
            });

        builder.Services.AddAuthorization();

        return builder;
    }

    private sealed class JwksOnlyConfigurationRetriever
        : IConfigurationRetriever<OpenIdConnectConfiguration>
    {
        public async Task<OpenIdConnectConfiguration> GetConfigurationAsync(
            string address,
            IDocumentRetriever retriever,
            CancellationToken cancel
        )
        {
            var jwksJson = await retriever.GetDocumentAsync(address, cancel);
            var configuration = new OpenIdConnectConfiguration
            {
                JsonWebKeySet = new JsonWebKeySet(jwksJson),
            };

            foreach (var key in configuration.JsonWebKeySet.GetSigningKeys())
            {
                configuration.SigningKeys.Add(key);
            }

            return configuration;
        }
    }
}
