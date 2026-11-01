using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using TestCraft.Api.Idempotency;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class IdempotencyKeyOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!context.MethodInfo.GetCustomAttributes(true).OfType<IdempotentAttribute>().Any())
        {
            return;
        }

        operation.Parameters ??= [];
        operation.Parameters.Add(
            new OpenApiParameter
            {
                Name = IdempotencyMiddleware.HeaderName,
                In = ParameterLocation.Header,
                Required = false,
                Description =
                    "Retrying with the same key replays the first response instead of repeating "
                    + "the write. Keys are kept for at least 24 hours.",
                Schema = new OpenApiSchema
                {
                    Type = JsonSchemaType.String,
                    MinLength = 1,
                    MaxLength = 255,
                },
            }
        );
    }
}
