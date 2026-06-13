using System.Security.Cryptography;
using System.Text;
using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class SwaggerExtensions
{
    public static WebApplicationBuilder AddSwaggerDocs(this WebApplicationBuilder builder)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();
        builder.Services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition(
                "bearerAuth",
                new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                }
            );

            options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("bearerAuth", null)] = [],
            });

            options.OperationFilter<AnonymousEndpointsOperationFilter>();
            options.OperationFilter<ProblemResponsesOperationFilter>();

            options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "TestCraft.Api.xml"));
        });

        return builder;
    }

    public static WebApplication UseSwaggerDocs(this WebApplication app)
    {
        var apiVersionDescriptionProvider =
            app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

        if (app.Environment.IsProduction())
        {
            var apiOptions = app.Services.GetRequiredService<ApiOptions>();

            app.UseWhen(
                context => context.Request.Path.StartsWithSegments(ApiPaths.DocsPrefix),
                branch =>
                {
                    branch.Use(
                        async (context, next) =>
                        {
                            if (
                                IsBasicAuthValid(
                                    context.Request.Headers.Authorization.ToString(),
                                    apiOptions.SwaggerBasicAuthUsername,
                                    apiOptions.SwaggerBasicAuthPassword
                                )
                            )
                            {
                                await next();
                                return;
                            }

                            context.Response.Headers.WWWAuthenticate =
                                "Basic realm=\"TestCraft API Docs\", charset=\"UTF-8\"";
                            await ProblemWriter.WriteAsync(context, Problems.Unauthorized());
                        }
                    );

                    branch.UseSwaggerMiddleware(apiVersionDescriptionProvider);
                }
            );
        }
        else
        {
            app.UseSwaggerMiddleware(apiVersionDescriptionProvider);
        }

        return app;
    }

    private static void UseSwaggerMiddleware(
        this IApplicationBuilder app,
        IApiVersionDescriptionProvider apiVersionDescriptionProvider
    )
    {
        app.UseSwagger(options =>
            options.RouteTemplate =
                $"{ApiPaths.DocsPrefix.TrimStart('/')}/{{documentName}}/swagger.json"
        );
        app.UseSwaggerUI(options =>
        {
            foreach (
                var groupName in apiVersionDescriptionProvider.ApiVersionDescriptions.Select(
                    description => description.GroupName
                )
            )
            {
                options.SwaggerEndpoint(
                    $"{ApiPaths.DocsPrefix}/{groupName}/swagger.json",
                    $"TestCraft API {groupName}"
                );
            }

            options.RoutePrefix = ApiPaths.DocsPrefix.TrimStart('/');
            options.DocumentTitle = "TestCraft API";
        });
    }

    private static bool IsBasicAuthValid(
        string authorizationHeader,
        string? expectedUsername,
        string? expectedPassword
    )
    {
        if (string.IsNullOrEmpty(expectedUsername) || string.IsNullOrEmpty(expectedPassword))
        {
            return false;
        }

        const string prefix = "Basic ";
        if (!authorizationHeader.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

        string credentials;
        try
        {
            credentials = Encoding.UTF8.GetString(
                Convert.FromBase64String(authorizationHeader[prefix.Length..])
            );
        }
        catch (FormatException)
        {
            return false;
        }

        var separatorIndex = credentials.IndexOf(':', StringComparison.Ordinal);
        if (separatorIndex < 0)
        {
            return false;
        }

        var username = credentials[..separatorIndex];
        var password = credentials[(separatorIndex + 1)..];

        return FixedTimeEquals(username, expectedUsername)
            && FixedTimeEquals(password, expectedPassword);
    }

    private static bool FixedTimeEquals(string actual, string expected)
    {
        var actualBytes = Encoding.UTF8.GetBytes(actual);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);

        return actualBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes);
    }
}

internal sealed class ConfigureSwaggerOptions(IApiVersionDescriptionProvider provider)
    : IConfigureNamedOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        foreach (var description in provider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(
                description.GroupName,
                new OpenApiInfo
                {
                    Title = "TestCraft API",
                    Version = description.ApiVersion.ToString(),
                    Description = "Test case management and execution tracking API.",
                }
            );
        }
    }

    public void Configure(string? name, SwaggerGenOptions options) => Configure(options);
}
