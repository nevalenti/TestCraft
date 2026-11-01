using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using TestCraft.Api.Errors;
using TestCraft.Application.Common.Extensions;
using TestCraft.Infrastructure.Auth;
using TestCraft.Persistence;

namespace TestCraft.Api.Idempotency;

public sealed class IdempotencyMiddleware(RequestDelegate next, TimeProvider timeProvider)
{
    public const string HeaderName = "Idempotency-Key";

    private static readonly TimeSpan AbandonedAfter = TimeSpan.FromMinutes(5);

    public async Task InvokeAsync(HttpContext httpContext, AppDbContext dbContext)
    {
        if (httpContext.GetEndpoint()?.Metadata.GetMetadata<IdempotentAttribute>() is null)
        {
            await next(httpContext);
            return;
        }

        var header = httpContext.Request.Headers[HeaderName];
        if (header.Count == 0)
        {
            await next(httpContext);
            return;
        }

        var key = header.ToString();
        if (header.Count != 1 || key.Length is < 1 or > 255 || key.Any(char.IsControl))
        {
            await ProblemWriter.WriteAsync(
                httpContext,
                Problems.Unprocessable(
                    "Idempotency-Key must be 1 to 255 characters without control characters"
                )
            );
            return;
        }

        var userId = httpContext.User.GetUserIdOrNull();
        if (userId is null)
        {
            await next(httpContext);
            return;
        }

        var tokenId = httpContext.User.FindFirstValue("api_token_id");
        var principal = tokenId is null ? $"user:{userId}" : $"token:{tokenId}";
        var requestHash = await HashRequestAsync(httpContext.Request, httpContext.RequestAborted);
        var records = dbContext.IdempotencyRecords.Where(record =>
            record.Principal == principal && record.Key == key
        );

        if (
            await TryReserveAsync(dbContext, records, principal, key, requestHash)
            is not { } reservedAt
        )
        {
            var stored = await records.AsNoTracking().SingleAsync(httpContext.RequestAborted);
            if (stored.StatusCode is null)
            {
                await WriteInProgressAsync(httpContext);
            }
            else if (stored.RequestHash != requestHash)
            {
                await ProblemWriter.WriteAsync(
                    httpContext,
                    Problems.Unprocessable(
                        "This Idempotency-Key was already used for a different request",
                        "IDEMPOTENCY_KEY_REUSED"
                    )
                );
            }
            else
            {
                await ReplayAsync(httpContext, stored);
            }

            return;
        }

        var reservation = records.Where(record =>
            record.CreatedAt == reservedAt && record.RequestHash == requestHash
        );
        var response = httpContext.Response;
        var originalBody = response.Body;
        await using var buffer = new MemoryStream();
        response.Body = buffer;
        try
        {
            await next(httpContext);
        }
        catch
        {
            await ReleaseAsync(reservation);
            throw;
        }
        finally
        {
            response.Body = originalBody;
        }

        if (response.StatusCode is >= 200 and < 300)
        {
            var body = buffer.ToArray();
            var contentType = response.ContentType;
            var location = response.Headers.Location.ToString();
            await reservation.ExecuteUpdateAsync(
                setters =>
                    setters
                        .SetProperty(record => record.StatusCode, response.StatusCode)
                        .SetProperty(record => record.ResponseBody, body)
                        .SetProperty(record => record.ContentType, contentType)
                        .SetProperty(record => record.Location, location),
                CancellationToken.None
            );
        }
        else
        {
            await ReleaseAsync(reservation);
        }

        buffer.Position = 0;
        await buffer.CopyToAsync(originalBody, httpContext.RequestAborted);
    }

    private async Task<DateTimeOffset?> TryReserveAsync(
        AppDbContext dbContext,
        IQueryable<IdempotencyRecord> records,
        string principal,
        string key,
        string requestHash
    )
    {
        var now = timeProvider.GetStoredUtcNow();
        var inserted = await dbContext.Database.ExecuteSqlAsync(
            $"""
            INSERT INTO idempotency_records (id, principal, key, request_hash, created_at)
            VALUES ({Guid.NewGuid()}, {principal}, {key}, {requestHash}, {now})
            ON CONFLICT (principal, key) DO NOTHING
            """,
            CancellationToken.None
        );
        if (inserted == 1)
        {
            return now;
        }

        var abandonedBefore = now - AbandonedAfter;
        var takenOver = await records
            .Where(record => record.StatusCode == null && record.CreatedAt < abandonedBefore)
            .ExecuteUpdateAsync(
                setters =>
                    setters
                        .SetProperty(record => record.RequestHash, requestHash)
                        .SetProperty(record => record.CreatedAt, now),
                CancellationToken.None
            );

        return takenOver == 1 ? now : null;
    }

    private static Task<int> ReleaseAsync(IQueryable<IdempotencyRecord> records) =>
        records
            .Where(record => record.StatusCode == null)
            .ExecuteDeleteAsync(CancellationToken.None);

    private static async Task<string> HashRequestAsync(
        HttpRequest request,
        CancellationToken cancellationToken
    )
    {
        request.EnableBuffering();
        var bodyHash = await SHA256.HashDataAsync(request.Body, cancellationToken);
        request.Body.Position = 0;
        var target =
            $"{request.Method}\0{request.Path}{request.QueryString}\0{Convert.ToHexString(bodyHash)}";

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(target)));
    }

    private static Task WriteInProgressAsync(HttpContext httpContext)
    {
        httpContext.Response.Headers.RetryAfter = "1";

        return ProblemWriter.WriteAsync(
            httpContext,
            Problems.Conflict("A request with this Idempotency-Key is still in progress") with
            {
                Code = "IDEMPOTENT_REQUEST_IN_PROGRESS",
            }
        );
    }

    private static async Task ReplayAsync(HttpContext httpContext, IdempotencyRecord stored)
    {
        var response = httpContext.Response;
        response.StatusCode = stored.StatusCode!.Value;
        response.ContentType = stored.ContentType;
        if (!string.IsNullOrEmpty(stored.Location))
        {
            response.Headers.Location = stored.Location;
        }

        if (stored.ResponseBody is { Length: > 0 } body)
        {
            await response.Body.WriteAsync(body, httpContext.RequestAborted);
        }
    }
}
