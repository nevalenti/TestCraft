using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class AuthenticationExtensions
{
    public static WebApplicationBuilder AddKeycloakAuthentication(
        this WebApplicationBuilder builder,
        ApiOptions apiOptions
    )
    {
        builder
            .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = apiOptions.KeycloakAuthority;
                options.Audience = apiOptions.KeycloakAudience;
                options.RequireHttpsMetadata = apiOptions.KeycloakRequireHttpsMetadata;

                options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    $"{apiOptions.KeycloakAuthority}/protocol/openid-connect/certs",
                    new JwksOnlyConfigurationRetriever(),
                    new HttpDocumentRetriever
                    {
                        RequireHttps = apiOptions.KeycloakRequireHttpsMetadata,
                    }
                );
                options.TokenValidationParameters.ValidIssuer =
                    apiOptions.KeycloakIssuer ?? apiOptions.KeycloakAuthority;

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
