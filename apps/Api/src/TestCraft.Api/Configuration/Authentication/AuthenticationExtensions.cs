using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using TestCraft.Api.Authorization;
using TestCraft.Api.Errors;
using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Authentication;

public static class AuthenticationExtensions
{
    private const string CombinedAuthenticationScheme = "Combined";

    public static WebApplicationBuilder AddKeycloakAuthentication(
        this WebApplicationBuilder builder,
        bool verifyTls
    )
    {
        var keycloakOptions = builder.Services.AddStartupOptions<KeycloakAuthOptions>(
            builder.Configuration
        );
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
                        {
                            return ApiTokenAuthenticationDefaults.AuthenticationScheme;
                        }

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
                var keycloakHttp = new HttpClient(KeycloakHttp.CreateHandler(verifyTls));

                options.ConfigurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                    $"{keycloakOptions.KeycloakAuthority}/protocol/openid-connect/certs",
                    new JwksOnlyConfigurationRetriever(),
                    new HttpDocumentRetriever(keycloakHttp)
                    {
                        RequireHttps = keycloakOptions.KeycloakRequireHttpsMetadata,
                    }
                );
                options.TokenValidationParameters.ValidIssuer = keycloakOptions.ValidIssuer;

                var authorizedParties = keycloakOptions.AuthorizedParties;
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = context =>
                    {
                        if (
                            authorizedParties.Count > 0
                            && !authorizedParties.Contains(
                                context.Principal?.FindFirst("azp")?.Value
                            )
                        )
                        {
                            context.Fail("Token was not issued to an authorized party");
                        }

                        return Task.CompletedTask;
                    },
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

        builder.Services.AddScoped<IAuthorizationHandler, ApiTokenScopeHandler>();
        builder.Services.AddScoped<IAuthorizationHandler, ProjectRoleHandler>();
        builder.Services.AddSingleton<
            IAuthorizationMiddlewareResultHandler,
            ProblemAuthorizationResultHandler
        >();
        builder
            .Services.AddAuthorizationBuilder()
            .SetDefaultPolicy(
                new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .AddRequirements(new ApiTokenScopeRequirement(), new ProjectRoleRequirement())
                    .Build()
            );

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
