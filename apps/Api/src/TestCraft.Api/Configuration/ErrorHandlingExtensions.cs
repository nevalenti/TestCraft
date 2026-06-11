using TestCraft.Api.Errors;

namespace TestCraft.Api.Configuration;

public static class ErrorHandlingExtensions
{
    public static WebApplicationBuilder AddErrorHandling(this WebApplicationBuilder builder)
    {
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
        builder.Services.AddProblemDetails();

        return builder;
    }
}
