using System.Globalization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class ProblemResponsesOperationFilter : IOperationFilter
{
    private const string ProblemContentType = "application/problem+json";

    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var requiresAuthorization = AnonymousEndpointsOperationFilter.RequiresAuthorization(
            context
        );

        if (requiresAuthorization)
        {
            AddResponse(operation, context, StatusCodes.Status401Unauthorized, "Unauthorized");
            AddResponse(operation, context, StatusCodes.Status403Forbidden, "Forbidden");
            AddResponse(operation, context, StatusCodes.Status404NotFound, "Not Found");
            AddResponse(operation, context, StatusCodes.Status408RequestTimeout, "Request Timeout");
            AddResponse(
                operation,
                context,
                StatusCodes.Status429TooManyRequests,
                "Too Many Requests"
            );
        }

        var httpMethod = context.ApiDescription.HttpMethod ?? string.Empty;

        if (
            HttpMethods.IsPost(httpMethod)
            || HttpMethods.IsPut(httpMethod)
            || HttpMethods.IsPatch(httpMethod)
        )
        {
            AddResponse<ValidationProblemResponse>(
                operation,
                context,
                StatusCodes.Status400BadRequest,
                "Validation Failed"
            );
            AddResponse(operation, context, StatusCodes.Status409Conflict, "Conflict");
        }

        AddResponse(
            operation,
            context,
            StatusCodes.Status500InternalServerError,
            "Internal Server Error"
        );
    }

    private static void AddResponse(
        OpenApiOperation operation,
        OperationFilterContext context,
        int statusCode,
        string description
    ) => AddResponse<ProblemResponse>(operation, context, statusCode, description);

    private static void AddResponse<TProblem>(
        OpenApiOperation operation,
        OperationFilterContext context,
        int statusCode,
        string description
    )
    {
        var key = statusCode.ToString(CultureInfo.InvariantCulture);

        operation.Responses ??= new OpenApiResponses();

        if (operation.Responses.ContainsKey(key))
        {
            return;
        }

        var schema = context.SchemaGenerator.GenerateSchema(
            typeof(TProblem),
            context.SchemaRepository
        );

        operation.Responses[key] = new OpenApiResponse
        {
            Description = description,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                [ProblemContentType] = new() { Schema = schema },
            },
        };
    }
}
