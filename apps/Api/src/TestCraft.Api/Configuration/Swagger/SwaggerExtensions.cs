using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using TestCraft.Api.Middleware;

namespace TestCraft.Api.Configuration.Swagger;

public static class SwaggerExtensions
{
    public static WebApplicationBuilder AddSwaggerDocs(this WebApplicationBuilder builder)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();
        builder.Services.AddSwaggerGen(options =>
        {
            options.CustomSchemaIds(type => (type.FullName ?? type.Name).Replace("+", "."));
            options.SupportNonNullableReferenceTypes();

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
            options.IncludeXmlComments(
                Path.Combine(AppContext.BaseDirectory, "TestCraft.Application.xml")
            );
        });

        return builder;
    }

    public static WebApplication UseSwaggerDocs(this WebApplication app)
    {
        var apiVersionDescriptionProvider =
            app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

        if (app.Environment.IsProduction())
        {
            app.UseWhen(
                context => context.Request.Path.StartsWithSegments(ApiPaths.DocsPrefix),
                branch =>
                {
                    branch.UseSwaggerBasicAuth();
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
