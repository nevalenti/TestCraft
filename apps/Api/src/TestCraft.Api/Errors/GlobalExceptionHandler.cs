using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common;
using TestCraft.Application.Common.Exceptions;

namespace TestCraft.Api.Errors;

public partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        switch (exception)
        {
            case NotFoundException:
                await ProblemWriter.WriteAsync(httpContext, Problems.NotFound());

                return true;

            case DomainException domainException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Unprocessable(domainException.Message)
                );

                return true;

            case ValidationException validationException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Validation(
                        validationException
                            .Errors.Select(e => new FieldError(
                                FieldNameConverter.ToCamelCase(e.PropertyName),
                                e.ErrorMessage
                            ))
                            .ToList()
                    )
                );

                return true;

            case DbUpdateException dbUpdateException
                when DbErrorHelpers.IsForeignKeyViolation(dbUpdateException):
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Conflict("Referenced entity does not exist")
                );

                return true;

            default:
                LogUnhandledException(
                    logger,
                    exception,
                    httpContext.Request.Method,
                    httpContext.Request.Path
                );
                await ProblemWriter.WriteAsync(httpContext, Problems.Internal());

                return true;
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception for {Method} {Path}")]
    private static partial void LogUnhandledException(
        ILogger logger,
        Exception exception,
        string method,
        PathString path
    );
}
