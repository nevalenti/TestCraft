using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration.Authentication;

public static class AuthenticationExtensions
{
    public static WebApplicationBuilder AddKeycloakAuthentication(
        this WebApplicationBuilder builder,
        KeycloakAuthOptions keycloakOptions
    )
    {
        builder
            .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakOptions.KeycloakAuthority;
                options.Audience = keycloakOptions.KeycloakAudience;
                options.RequireHttpsMetadata = keycloakOptions.KeycloakRequireHttpsMetadata;

                options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    $"{keycloakOptions.KeycloakAuthority}/protocol/openid-connect/certs",
                    new JwksOnlyConfigurationRetriever(),
                    new HttpDocumentRetriever
                    {
                        RequireHttps = keycloakOptions.KeycloakRequireHttpsMetadata,
                    }
                );
                options.TokenValidationParameters.ValidIssuer =
                    keycloakOptions.KeycloakIssuer ?? keycloakOptions.KeycloakAuthority;

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
                        await ProblemWriter.WriteAsync(context.HttpContext, Problems.Forbidden()),
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
