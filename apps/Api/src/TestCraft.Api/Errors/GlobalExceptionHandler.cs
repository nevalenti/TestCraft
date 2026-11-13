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
        var method = httpContext.Request.Method;
        var safePath = ApiPaths.RedactSecrets(httpContext.Request.Path);

        if (
            exception is OperationCanceledException
            && httpContext.RequestAborted.IsCancellationRequested
        )
        {
            LogClientDisconnected(logger, method, safePath);

            return true;
        }

        switch (exception)
        {
            case BadHttpRequestException badRequest:
                LogBadRequest(logger, badRequest, method, safePath, badRequest.StatusCode);
                break;
            case DomainException domain:
                LogDomainRuleViolation(logger, domain, method, safePath, domain.Message);
                break;
            case DbUpdateException dbUpdate
                when dbExceptionClassifier.IsForeignKeyViolation(dbUpdate):
                LogForeignKeyConflict(logger, dbUpdate, method, safePath);
                break;
            case DbUpdateException dbUpdate when dbExceptionClassifier.IsUniqueViolation(dbUpdate):
                LogUniqueConstraintConflict(logger, dbUpdate, method, safePath);
                break;
            case RedisException redis:
                LogBackingServiceUnavailable(logger, redis, method, safePath);
                httpContext.Response.Headers.RetryAfter = "1";
                break;
        }

        var problem = ToProblem(exception, httpContext.Request);
        if (problem is null)
        {
            LogUnhandledException(logger, exception, method, safePath);
            problem = Problems.Internal(
                hostEnvironment.IsDevelopment()
                    ? $"{exception.GetType().Name}: {exception.Message}"
                    : null
            );
        }

        await ProblemWriter.WriteAsync(httpContext, problem);

        return true;
    }

    private ProblemResponse? ToProblem(Exception exception, HttpRequest request) =>
        exception switch
        {
            BadHttpRequestException { StatusCode: StatusCodes.Status413PayloadTooLarge } =>
                Problems.ContentTooLarge(),
            BadHttpRequestException badRequest => Problems.ForStatus(badRequest.StatusCode),
            NotFoundException => Problems.NotFound(),
            UnauthorizedException unauthorized => Problems.Unauthorized() with
            {
                Detail = unauthorized.Message,
            },
            ConflictException conflict => Problems.Conflict(conflict.Message) with
            {
                Code = conflict.Code,
            },
            ForbiddenException forbidden => Problems.Forbidden() with
            {
                Detail = forbidden.Message,
                Code = forbidden.Code,
            },
            PreconditionFailedException preconditionFailed => Problems.PreconditionFailed(
                preconditionFailed.Message
            ),
            DbUpdateConcurrencyException => Problems.PreconditionFailed(
                "The resource changed during the update"
            ),
            DomainException domain => Problems.Unprocessable(domain.Message, domain.ErrorCode),
            ValidationException validation => Problems.Validation(
                validation
                    .Errors.Select(error =>
                        ValidationErrors.ForMember(request, error.PropertyName, error.ErrorMessage)
                    )
                    .ToList()
            ),
            DbUpdateException dbUpdate when dbExceptionClassifier.IsForeignKeyViolation(dbUpdate) =>
                Problems.Conflict("Referenced entity does not exist"),
            DbUpdateException dbUpdate when dbExceptionClassifier.IsUniqueViolation(dbUpdate) =>
                Problems.Conflict("A record with these values already exists"),
            RedisException => Problems.ServiceUnavailable(),
            _ => null,
        };

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
