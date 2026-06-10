namespace TestCraft.Api.Errors;

public static class Problems
{
    private const string AboutBlank = "about:blank";

    public static ValidationProblemResponse Validation(
        IReadOnlyList<FieldError> errors
    ) =>
        new()
        {
            Type = AboutBlank,
            Title = "Validation Failed",
            Status = StatusCodes.Status400BadRequest,
            Errors = errors,
        };

    public static ProblemResponse Unauthorized() =>
        new()
        {
            Type = AboutBlank,
            Title = "Unauthorized",
            Status = StatusCodes.Status401Unauthorized,
        };

    public static ProblemResponse Forbidden() =>
        new()
        {
            Type = AboutBlank,
            Title = "Forbidden",
            Status = StatusCodes.Status403Forbidden,
        };

    public static ProblemResponse NotFound() =>
        new()
        {
            Type = AboutBlank,
            Title = "Not Found",
            Status = StatusCodes.Status404NotFound,
        };

    public static ProblemResponse Timeout() =>
        new()
        {
            Type = AboutBlank,
            Title = "Request Timeout",
            Status = StatusCodes.Status408RequestTimeout,
            Detail = "The server did not receive a complete request in time.",
        };

    public static ProblemResponse Conflict(string detail) =>
        new()
        {
            Type = AboutBlank,
            Title = "Conflict",
            Status = StatusCodes.Status409Conflict,
            Detail = detail,
        };

    public static ProblemResponse Unprocessable(string detail) =>
        new()
        {
            Type = AboutBlank,
            Title = "Unprocessable Content",
            Status = StatusCodes.Status422UnprocessableEntity,
            Detail = detail,
        };

    public static ProblemResponse TooManyRequests() =>
        new()
        {
            Type = AboutBlank,
            Title = "Too Many Requests",
            Status = StatusCodes.Status429TooManyRequests,
            Detail = "Rate limit exceeded, please try again later.",
        };

    public static ProblemResponse Internal() =>
        new()
        {
            Type = AboutBlank,
            Title = "An unexpected error occurred",
            Status = StatusCodes.Status500InternalServerError,
        };
}
