using Microsoft.AspNetCore.Http.Timeouts;
using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class ErrorHandlingExtensions
{
    public static WebApplicationBuilder AddErrorHandling(this WebApplicationBuilder builder)
    {
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();

        builder.Services.AddRequestTimeouts(options =>
        {
            options.DefaultPolicy = new RequestTimeoutPolicy
            {
                Timeout = TimeSpan.FromSeconds(30),
                WriteTimeoutResponse = context =>
                    ProblemWriter.WriteAsync(context, Problems.Timeout()),
            };
        });

        return builder;
    }
}
