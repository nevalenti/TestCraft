using System.Reflection;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class VogenSchemaFilter : ISchemaFilter
{
    public void Apply(IOpenApiSchema schema, SchemaFilterContext context)
    {
        if (!IsGuidValueObject(context.Type) || schema is not OpenApiSchema concreteSchema)
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

    private static bool IsGuidValueObject(Type type)
    {
        if (!type.IsValueType || type.IsPrimitive || type.IsEnum)
        {
            return false;
        }

        var valueProperty = type.GetProperty("Value", BindingFlags.Public | BindingFlags.Instance);

        if (valueProperty?.PropertyType != typeof(Guid))
        {
            return false;
        }

        var fromMethod = type.GetMethod(
            "From",
            BindingFlags.Public | BindingFlags.Static,
            [typeof(Guid)]
        );

        return fromMethod?.ReturnType == type;
    }
}
