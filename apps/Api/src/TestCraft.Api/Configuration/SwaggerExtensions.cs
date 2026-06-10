using Microsoft.OpenApi;

namespace TestCraft.Api.Configuration;

public static class SwaggerExtensions
{
    public static WebApplicationBuilder AddSwaggerDocs(
        this WebApplicationBuilder builder
    )
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc(
                "v1",
                new OpenApiInfo
                {
                    Title = "TestCraft API",
                    Version = "1.0.0",
                    Description =
                        "Test case management and execution tracking API.",
                }
            );

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
        app.UseSwagger(options =>
            options.RouteTemplate = "api/v1/docs/{documentName}/swagger.json"
        );
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint(
                "/api/v1/docs/v1/swagger.json",
                "TestCraft API"
            );
            options.RoutePrefix = "api/v1/docs";
            options.DocumentTitle = "TestCraft API";
        });

        return app;
    }
}
