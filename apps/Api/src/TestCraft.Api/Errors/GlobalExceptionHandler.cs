using FluentValidation;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Api.Errors;

public partial class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IDbExceptionClassifier dbExceptionClassifier
) : IExceptionHandler
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
                LogDomainRuleViolation(
                    logger,
                    httpContext.Request.Method,
                    httpContext.Request.Path,
                    domainException.Message
                );
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
                            .Errors.Select(error => new FieldError(
                                FieldNameConverter.ToCamelCase(error.PropertyName),
                                error.ErrorMessage
                            ))
                            .ToList()
                    )
                );

                return true;

            case DbUpdateException dbUpdateException
                when dbExceptionClassifier.IsForeignKeyViolation(dbUpdateException):
                LogForeignKeyConflict(
                    logger,
                    dbUpdateException,
                    httpContext.Request.Method,
                    httpContext.Request.Path
                );
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Conflict("Referenced entity does not exist")
                );

                return true;

            case DbUpdateException dbUpdateException
                when dbExceptionClassifier.IsUniqueViolation(dbUpdateException):
                LogUniqueConstraintConflict(
                    logger,
                    dbUpdateException,
                    httpContext.Request.Method,
                    httpContext.Request.Path
                );
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Conflict("A record with these values already exists")
                );

                return true;

            case OperationCanceledException when httpContext.RequestAborted.IsCancellationRequested:
                LogClientDisconnected(logger, httpContext.Request.Method, httpContext.Request.Path);

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

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Domain rule violation for {Method} {Path}: {Reason}"
    )]
    private static partial void LogDomainRuleViolation(
        ILogger logger,
        string method,
        PathString path,
        string reason
    );

    [LoggerMessage(Level = LogLevel.Warning, Message = "Foreign key conflict for {Method} {Path}")]
    private static partial void LogForeignKeyConflict(
        ILogger logger,
        Exception exception,
        string method,
        PathString path
    );

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Unique constraint conflict for {Method} {Path}"
    )]
    private static partial void LogUniqueConstraintConflict(
        ILogger logger,
        Exception exception,
        string method,
        PathString path
    );

    [LoggerMessage(
        Level = LogLevel.Debug,
        Message = "Client disconnected before response completed for {Method} {Path}"
    )]
    private static partial void LogClientDisconnected(
        ILogger logger,
        string method,
        PathString path
    );
}
