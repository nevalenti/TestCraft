using Microsoft.AspNetCore.WebUtilities;

namespace TestCraft.Api.Errors;

public static class Problems
{
    private const string AboutBlank = "about:blank";

    public static ValidationProblemResponse Validation(IReadOnlyList<FieldError> errors) =>
        new()
        {
            Type = AboutBlank,
            Title = "Validation Failed",
            Status = StatusCodes.Status422UnprocessableEntity,
            Detail = ValidationErrors.Summary(errors),
            Errors = errors,
        };

    public static ProblemResponse ForStatus(int status) =>
        new()
        {
            Type = AboutBlank,
            Title = ReasonPhrases.GetReasonPhrase(status),
            Status = status,
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

    public static ProblemResponse PreconditionFailed(string detail) =>
        new()
        {
            Type = AboutBlank,
            Title = "Precondition Failed",
            Status = StatusCodes.Status412PreconditionFailed,
            Detail = detail,
        };

    public static ProblemResponse Unprocessable(string detail, string? code = null) =>
        new()
        {
            Type = AboutBlank,
            Title = "Unprocessable Content",
            Status = StatusCodes.Status422UnprocessableEntity,
            Detail = detail,
            Code = code,
        };

    public static ProblemResponse ContentTooLarge() =>
        new()
        {
            Type = AboutBlank,
            Title = "Content Too Large",
            Status = StatusCodes.Status413PayloadTooLarge,
            Detail = "Request body too large",
        };

    public static ProblemResponse TooManyRequests() =>
        new()
        {
            Type = AboutBlank,
            Title = "Too Many Requests",
            Status = StatusCodes.Status429TooManyRequests,
            Detail = "Too Many Requests",
        };

    public static ProblemResponse ServiceUnavailable() =>
        new()
        {
            Type = AboutBlank,
            Title = "Service Unavailable",
            Status = StatusCodes.Status503ServiceUnavailable,
            Detail = "A backing service is unavailable; please retry",
        };

    public static ProblemResponse Internal(string? detail = null) =>
        new()
        {
            Type = AboutBlank,
            Title = "An unexpected error occurred",
            Status = StatusCodes.Status500InternalServerError,
            Detail = detail,
        };
}
