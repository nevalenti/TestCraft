using System.Text.Json;

namespace TestCraft.Api.Errors;

public static class ProblemWriter
{
    private const string ProblemContentType = "application/problem+json";

    private static readonly JsonSerializerOptions SerializerOptions = new(
        JsonSerializerDefaults.Web
    );

    public static Task WriteAsync(HttpContext context, ProblemResponse problem)
    {
        var instance = context.Request.Headers["x-request-id"].FirstOrDefault();
        var body = instance is not null ? problem with { Instance = instance } : problem;

        context.Response.StatusCode = problem.Status;
        context.Response.ContentType = ProblemContentType;

        return context.Response.WriteAsync(
            JsonSerializer.Serialize(body, body.GetType(), SerializerOptions)
        );
    }
}
