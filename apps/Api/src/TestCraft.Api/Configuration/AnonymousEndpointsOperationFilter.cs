using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace TestCraft.Api.Configuration;

/// <summary>
/// Clears the document-wide bearer auth requirement for endpoints that don't require authorization,
/// so Swagger UI doesn't prompt for a token on endpoints like health checks.
/// </summary>
public sealed class AnonymousEndpointsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (!RequiresAuthorization(context))
        {
            operation.Security = [];
        }
    }

    internal static bool RequiresAuthorization(OperationFilterContext context)
    {
        var declaringType = context.MethodInfo.DeclaringType;

        var hasAuthorize =
            declaringType?.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any() == true
            || context.MethodInfo.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any();

        var hasAllowAnonymous =
            declaringType?.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any() == true
            || context.MethodInfo.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any();

        return hasAuthorize && !hasAllowAnonymous;
    }
}
