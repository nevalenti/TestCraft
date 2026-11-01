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
                await ProblemWriter.WriteAsync(
                    httpContext,
                    badRequestException.StatusCode == StatusCodes.Status413PayloadTooLarge
                        ? Problems.ContentTooLarge()
                        : Problems.ForStatus(badRequestException.StatusCode)
                );

                return true;

            case NotFoundException:
                await ProblemWriter.WriteAsync(httpContext, Problems.NotFound());

                return true;

            case UnauthorizedException unauthorizedException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Unauthorized() with
                    {
                        Detail = unauthorizedException.Message,
                    }
                );

                return true;

            case ConflictException conflictException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Conflict(conflictException.Message) with
                    {
                        Code = conflictException.Code,
                    }
                );

                return true;

            case ForbiddenException forbiddenException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Forbidden() with
                    {
                        Detail = forbiddenException.Message,
                        Code = forbiddenException.Code,
                    }
                );

                return true;

            case PreconditionFailedException preconditionFailedException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.PreconditionFailed(preconditionFailedException.Message)
                );

                return true;

            case DbUpdateConcurrencyException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.PreconditionFailed("The resource changed during the update")
                );

                return true;

            case DomainException domainException:
                LogDomainRuleViolation(
                    logger,
                    domainException,
                    httpContext.Request.Method,
                    safePath,
                    domainException.Message
                );
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Unprocessable(domainException.Message, domainException.ErrorCode)
                );

                return true;

            case ValidationException validationException:
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Validation(
                        validationException
                            .Errors.Select(error =>
                                ValidationErrors.ForMember(
                                    httpContext.Request,
                                    error.PropertyName,
                                    error.ErrorMessage
                                )
                            )
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
                    safePath
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
                    safePath
                );
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Conflict("A record with these values already exists")
                );

                return true;

            case RedisException redisException:
                LogBackingServiceUnavailable(
                    logger,
                    redisException,
                    httpContext.Request.Method,
                    safePath
                );
                httpContext.Response.Headers.RetryAfter = "1";
                await ProblemWriter.WriteAsync(httpContext, Problems.ServiceUnavailable());

                return true;

            case OperationCanceledException when httpContext.RequestAborted.IsCancellationRequested:
                LogClientDisconnected(logger, httpContext.Request.Method, safePath);

                return true;

            default:
                LogUnhandledException(logger, exception, httpContext.Request.Method, safePath);
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Internal(
                        hostEnvironment.IsDevelopment()
                            ? $"{exception.GetType().Name}: {exception.Message}"
                            : null
                    )
                );

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
