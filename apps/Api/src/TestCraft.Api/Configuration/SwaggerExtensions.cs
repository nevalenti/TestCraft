using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

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
        });

        return builder;
    }

    public static WebApplication UseSwaggerDocs(this WebApplication app)
    {
        var apiVersionDescriptionProvider =
            app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

        app.UseSwagger(options =>
            options.RouteTemplate = "api/v1/docs/{documentName}/swagger.json"
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
                    $"/api/v1/docs/{groupName}/swagger.json",
                    $"TestCraft API {groupName}"
                );
            }

            options.RoutePrefix = "api/v1/docs";
            options.DocumentTitle = "TestCraft API";
        });

        return app;
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
