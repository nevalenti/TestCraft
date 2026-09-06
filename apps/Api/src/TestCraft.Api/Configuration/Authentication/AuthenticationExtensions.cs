using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

using TestCraft.Api.Errors;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Configuration.Authentication;

public static class AuthenticationExtensions
{
    private const string CombinedAuthenticationScheme = "Combined";

    public static WebApplicationBuilder AddKeycloakAuthentication(
        this WebApplicationBuilder builder,
        KeycloakAuthOptions keycloakOptions
    )
    {
        builder
            .Services.AddAuthentication(options =>
            {
                options.DefaultScheme = CombinedAuthenticationScheme;
                options.DefaultChallengeScheme = CombinedAuthenticationScheme;
            })
            .AddPolicyScheme(
                CombinedAuthenticationScheme,
                CombinedAuthenticationScheme,
                options =>
                {
                    options.ForwardDefaultSelector = context =>
                    {
                        const string prefix = "Bearer ";
                        var header = context.Request.Headers.Authorization.ToString();
                        if (
                            header.StartsWith(prefix, StringComparison.Ordinal)
                            && !header[prefix.Length..].Contains('.')
                        )
                            return ApiTokenAuthenticationDefaults.AuthenticationScheme;

                        return JwtBearerDefaults.AuthenticationScheme;
                    };
                }
            )
            .AddScheme<AuthenticationSchemeOptions, ApiTokenAuthenticationHandler>(
                ApiTokenAuthenticationDefaults.AuthenticationScheme,
                _ => { }
            )
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
