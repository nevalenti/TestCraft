using Microsoft.Extensions.Options;

namespace TestCraft.Api.Errors;

public static class ProblemWriter
{
    private const string ProblemContentType = "application/problem+json";

    public static Task WriteAsync(HttpContext context, ProblemResponse problem)
    {
        if (context.Response.HasStarted)
        {
            return Task.CompletedTask;
        }

        var instance = context.Request.Headers["x-request-id"].FirstOrDefault();
        var body = instance is not null ? problem with { Instance = instance } : problem;
        var serializerOptions = context
            .RequestServices.GetRequiredService<IOptions<Microsoft.AspNetCore.Mvc.JsonOptions>>()
            .Value.JsonSerializerOptions;

        context.Response.StatusCode = problem.Status;

        return context.Response.WriteAsJsonAsync(
            body,
            body.GetType(),
            serializerOptions,
            ProblemContentType,
            context.RequestAborted
        );
    }
}
