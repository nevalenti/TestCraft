using Microsoft.OpenApi;

using Swashbuckle.AspNetCore.SwaggerGen;

using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class VogenSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (
            !VogenGuidValueObjects.IsGuidValueObject(context.Type)
            || schema is not OpenApiSchema concreteSchema
        )
        {
            return;
        }

        concreteSchema.Type = JsonSchemaType.String;
        concreteSchema.Format = "uuid";
        concreteSchema.Properties?.Clear();
        concreteSchema.Required?.Clear();
        concreteSchema.AdditionalPropertiesAllowed = true;
        concreteSchema.AdditionalProperties = null;
    }
}
