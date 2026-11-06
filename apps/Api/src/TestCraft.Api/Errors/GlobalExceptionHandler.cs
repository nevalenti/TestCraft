using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Serilog.Context;
using StackExchange.Redis;
using TestCraft.Api.Configuration.Controllers;
using TestCraft.Api.Configuration.Observability;
using TestCraft.Api.Middleware;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Common.Logging;
using TestCraft.Domain.Exceptions;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Errors;

public partial class GlobalExceptionHandler(
    ILogger<GlobalExceptionHandler> logger,
    IDbExceptionClassifier dbExceptionClassifier,
    IHostEnvironment hostEnvironment
) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken
    )
    {
        var pageId = httpContext.Items[PageIdMiddleware.ItemsKey] as string;
        var userId = httpContext.User.GetUserIdOrNull();
        using var _ = LogContextExtensions.PushProperties(
            LogContext.PushProperty("requestId", httpContext.TraceIdentifier),
            pageId is not null ? LogContext.PushProperty("pageId", pageId) : null,
            userId is not null ? LogContext.PushProperty("userId", userId) : null
        );

        if (ToProblem(httpContext, exception) is { } problem)
        {
            await ProblemWriter.WriteAsync(httpContext, problem);
        }

        return true;
    }

    private ProblemResponse? ToProblem(HttpContext httpContext, Exception exception)
    {
        var safePath = ApiPaths.RedactSecrets(httpContext.Request.Path);

        switch (exception)
        {
            case BadHttpRequestException badRequestException:
                LogBadRequest(
                    logger,
                    badRequestException,
                    httpContext.Request.Method,
                    safePath,
                    badRequestException.StatusCode
                );
                return badRequestException.StatusCode == StatusCodes.Status413PayloadTooLarge
                    ? Problems.ContentTooLarge()
                    : Problems.ForStatus(badRequestException.StatusCode);

            case NotFoundException:
                return Problems.NotFound();

            case UnauthorizedException unauthorizedException:
                return Problems.Unauthorized() with { Detail = unauthorizedException.Message };

            case ConflictException conflictException:
                return Problems.Conflict(conflictException.Message) with
                {
                    Code = conflictException.Code,
                };

            case ForbiddenException forbiddenException:
                return Problems.Forbidden() with
                {
                    Detail = forbiddenException.Message,
                    Code = forbiddenException.Code,
                };

            case PreconditionFailedException preconditionFailedException:
                return Problems.PreconditionFailed(preconditionFailedException.Message);

            case DbUpdateConcurrencyException:
                return Problems.PreconditionFailed("The resource changed during the update");

            case DomainException domainException:
                LogDomainRuleViolation(
                    logger,
                    domainException,
                    httpContext.Request.Method,
                    safePath,
                    domainException.Message
                );
                return Problems.Unprocessable(domainException.Message, domainException.ErrorCode);

            case ValidationException validationException:
                return Problems.Validation(
                    validationException
                        .Errors.Select(error =>
                            ValidationErrors.ForMember(
                                httpContext.Request,
                                error.PropertyName,
                                error.ErrorMessage
                            )
                        )
                        .ToList()
                );

            case DbUpdateException dbUpdateException
                when dbExceptionClassifier.IsForeignKeyViolation(dbUpdateException):
                LogForeignKeyConflict(
                    logger,
                    dbUpdateException,
                    httpContext.Request.Method,
                    safePath
                );
                return Problems.Conflict("Referenced entity does not exist");

            case DbUpdateException dbUpdateException
                when dbExceptionClassifier.IsUniqueViolation(dbUpdateException):
                LogUniqueConstraintConflict(
                    logger,
                    dbUpdateException,
                    httpContext.Request.Method,
                    safePath
                );
                return Problems.Conflict("A record with these values already exists");

            case RedisException redisException:
                LogBackingServiceUnavailable(
                    logger,
                    redisException,
                    httpContext.Request.Method,
                    safePath
                );
                httpContext.Response.Headers.RetryAfter = "1";
                return Problems.ServiceUnavailable();

            case OperationCanceledException when httpContext.RequestAborted.IsCancellationRequested:
                LogClientDisconnected(logger, httpContext.Request.Method, safePath);

                return null;

            default:
                LogUnhandledException(logger, exception, httpContext.Request.Method, safePath);
                return Problems.Internal(
                    hostEnvironment.IsDevelopment()
                        ? $"{exception.GetType().Name}: {exception.Message}"
                        : null
                );
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
        Message = "Bad request for {Method} {Path}: {StatusCode}"
    )]
    private static partial void LogBadRequest(
        ILogger logger,
        Exception exception,
        string method,
        PathString path,
        int statusCode
    );

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Domain rule violation for {Method} {Path}: {Reason}"
    )]
    private static partial void LogDomainRuleViolation(
        ILogger logger,
        Exception exception,
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

    [LoggerMessage(Level = LogLevel.Warning, Message = "Redis unavailable for {Method} {Path}")]
    private static partial void LogBackingServiceUnavailable(
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
