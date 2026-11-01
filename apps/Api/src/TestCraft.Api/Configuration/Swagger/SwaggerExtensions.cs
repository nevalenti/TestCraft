using System.Text.Json;
using System.Text.Json.Nodes;
using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerGen;
using TestCraft.Common.Security;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Persistence.Vogen;

namespace TestCraft.Api.Configuration.Swagger;

public static class SwaggerExtensions
{
    private const string ContractPath = $"{ApiPaths.DocsPrefix}/v1/contract.json";

    public static WebApplicationBuilder AddSwaggerDocs(this WebApplicationBuilder builder)
    {
        builder.Services.AddStartupOptions<SwaggerBasicAuthOptions>(builder.Configuration);
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.ConfigureOptions<ConfigureSwaggerOptions>();
        builder.Services.AddSwaggerGen(options =>
        {
            options.CustomSchemaIds(GetSchemaId);
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
            options.OperationFilter<IdempotencyKeyOperationFilter>();
            options.UseAllOfToExtendReferenceSchemas();
            MapIdsToUuids(options);

            options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "TestCraft.Api.xml"));
            options.IncludeXmlComments(
                Path.Combine(AppContext.BaseDirectory, "TestCraft.Application.xml")
            );
        });

        return builder;
    }

    private static void MapIdsToUuids(SwaggerGenOptions options)
    {
        foreach (var idType in VogenGuidValueObjects.AllIn(typeof(ProjectId).Assembly))
        {
            options.MapType(
                idType,
                () => new OpenApiSchema { Type = JsonSchemaType.String, Format = "uuid" }
            );
        }
    }

    private static string GetSchemaId(Type type)
    {
        if (!type.IsGenericType)
        {
            return (type.FullName ?? type.Name).Replace("+", ".");
        }

        var genericTypeName = type.Name[..type.Name.IndexOf('`')];
        var genericArgNames = type.GetGenericArguments().Select(GetSchemaId);

        return $"{genericTypeName}{string.Concat(genericArgNames)}".Replace("+", ".");
    }

    public static WebApplication UseSwaggerDocs(this WebApplication app)
    {
        if (app.Environment.IsProduction())
        {
            app.UseWhen(
                context => context.Request.Path.StartsWithSegments(ApiPaths.DocsPrefix),
                branch => branch.UseBasicAuth<SwaggerBasicAuthOptions>()
            );
        }

        var contract = LoadContract();
        app.Map(
            ContractPath,
            branch =>
                branch.Run(context =>
                {
                    context.Response.ContentType = "application/json";

                    return context.Response.Body.WriteAsync(contract).AsTask();
                })
        );

        app.UseSwagger(options =>
            options.RouteTemplate =
                $"{ApiPaths.DocsPrefix.TrimStart('/')}/{{documentName}}/swagger.json"
        );

        app.MapGet(
                $"{ApiPaths.DocsPrefix}/index.html",
                () => Results.Redirect($"{ApiPaths.DocsPrefix}/", permanent: true)
            )
            .ExcludeFromDescription();

        var apiVersionDescriptionProvider =
            app.Services.GetRequiredService<IApiVersionDescriptionProvider>();
        app.MapScalarApiReference(
            ApiPaths.DocsPrefix,
            options =>
            {
                options
                    .WithTitle("TestCraft API")
                    .WithOpenApiRoutePattern(
                        $"{ApiPaths.DocsPrefix}/{{documentName}}/contract.json"
                    )
                    .AddDocument("v1", "TestCraft API v1", isDefault: true)
                    .DisableDefaultFonts()
                    .HideDeveloperTools()
                    .DisableAgent()
                    .DisableMcp()
                    .DisableTelemetry();

                foreach (
                    var groupName in apiVersionDescriptionProvider.ApiVersionDescriptions.Select(
                        description => description.GroupName
                    )
                )
                {
                    options.AddDocument(
                        $"{groupName}-generated",
                        $"TestCraft API {groupName} (generated)",
                        $"{ApiPaths.DocsPrefix}/{groupName}/swagger.json"
                    );
                }
            }
        );

        return app;
    }

    private static byte[] LoadContract()
    {
        using var stream = typeof(SwaggerExtensions).Assembly.GetManifestResourceStream(
            "openapi-contract.json"
        )!;
        var contract = JsonNode.Parse(stream)!;

        contract["servers"] = new JsonArray(
            new JsonObject { ["url"] = "/", ["description"] = "Same origin as this API reference." }
        );

        return JsonSerializer.SerializeToUtf8Bytes(contract);
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
