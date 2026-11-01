using System.Net.WebSockets;
using System.Text;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.Realtime;

public sealed partial class RealtimeSocketServer(
    SocketTickets tickets,
    IConnectionSlots slots,
    RunEventBroker broker,
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<RealtimeSocketServer> logger
)
{
    private const WebSocketCloseStatus PolicyViolation = WebSocketCloseStatus.PolicyViolation;
    private const WebSocketCloseStatus InternalError = WebSocketCloseStatus.InternalServerError;
    private const WebSocketCloseStatus ServiceRestart = (WebSocketCloseStatus)1012;
    private const WebSocketCloseStatus TryAgainLater = (WebSocketCloseStatus)1013;

    private static readonly TimeSpan RevalidateInterval = TimeSpan.FromSeconds(60);

    public Task ServeRunAsync(HttpContext context, TestRunId runId) =>
        DeferOnRedisFailureAsync(context, () => AcceptRunAsync(context, runId));

    public Task ServeDashboardAsync(HttpContext context) =>
        DeferOnRedisFailureAsync(context, () => AcceptDashboardAsync(context));

    private static async Task DeferOnRedisFailureAsync(HttpContext context, Func<Task> serve)
    {
        try
        {
            await serve();
        }
        catch (RedisException) when (!context.Response.HasStarted)
        {
            await RejectAsync(context, TryAgainLater);
        }
    }

    private async Task AcceptRunAsync(HttpContext context, TestRunId runId)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        var grant = await tickets.RedeemAsync(context.Request.Query["ticket"].ToString());

        if (
            grant is not { RunId: { } grantedRun }
            || grantedRun != runId
            || grant.SessionExpiresAt <= timeProvider.GetUtcNow()
            || !await CanSeeRunAsync(grant.UserId, runId, context.RequestAborted)
        )
        {
            await RejectAsync(context, PolicyViolation);
            return;
        }

        if (!await slots.TryAcquireAsync(grant.UserId))
        {
            await RejectAsync(context, TryAgainLater);
            return;
        }

        try
        {
            using var subscription = broker.SubscribeToRun(runId);
            using var socket = await context.WebSockets.AcceptWebSocketAsync();
            await RelayAsync(
                context,
                socket,
                subscription.Messages,
                grant.SessionExpiresAt,
                async cancellationToken =>
                    await CanSeeRunAsync(grant.UserId, runId, cancellationToken)
                        ? null
                        : PolicyViolation
            );
        }
        finally
        {
            await slots.ReleaseAsync(grant.UserId);
        }
    }

    private async Task AcceptDashboardAsync(HttpContext context)
    {
        if (!context.WebSockets.IsWebSocketRequest)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        var grant = await tickets.RedeemAsync(context.Request.Query["ticket"].ToString());

        if (grant is not { RunId: null } || grant.SessionExpiresAt <= timeProvider.GetUtcNow())
        {
            await RejectAsync(context, PolicyViolation);
            return;
        }

        if (!await slots.TryAcquireAsync(grant.UserId))
        {
            await RejectAsync(context, TryAgainLater);
            return;
        }

        try
        {
            var projectIds = await VisibleProjectIdsAsync(grant.UserId, context.RequestAborted);
            using var subscription = broker.SubscribeToDashboard(projectIds);
            using var socket = await context.WebSockets.AcceptWebSocketAsync();
            await RelayAsync(
                context,
                socket,
                subscription.Messages,
                grant.SessionExpiresAt,
                async cancellationToken =>
                {
                    subscription.ProjectIds = await VisibleProjectIdsAsync(
                        grant.UserId,
                        cancellationToken
                    );
                    return null;
                }
            );
        }
        finally
        {
            await slots.ReleaseAsync(grant.UserId);
        }
    }

    private static async Task RejectAsync(HttpContext context, WebSocketCloseStatus status)
    {
        using var socket = await context.WebSockets.AcceptWebSocketAsync();
        await CloseAsync(socket, status);
    }

    private async Task RelayAsync(
        HttpContext context,
        WebSocket socket,
        System.Threading.Channels.ChannelReader<string> messages,
        DateTimeOffset sessionExpiresAt,
        Func<CancellationToken, Task<WebSocketCloseStatus?>> revalidate
    )
    {
        using var stop = CancellationTokenSource.CreateLinkedTokenSource(context.RequestAborted);
        var relay = SendAllAsync(socket, messages, stop.Token);
        var disconnect = WaitForDisconnectAsync(socket, stop.Token);
        var access = EnforceAccessAsync(sessionExpiresAt, revalidate, stop.Token);

        var finished = await Task.WhenAny(relay, disconnect, access);
        await stop.CancelAsync();

        try
        {
            if (finished == access && !disconnect.IsCompleted)
            {
                await CloseAsync(socket, await access);
            }
            else if (finished == relay)
            {
                await relay;
                await CloseAsync(socket, WebSocketCloseStatus.NormalClosure);
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            LogRelayFailed(logger, exception);
            await CloseAsync(socket, InternalError);
        }

        await Task.WhenAll(relay, disconnect, access).ContinueWith(_ => { }, TaskScheduler.Default);
    }

    private static async Task SendAllAsync(
        WebSocket socket,
        System.Threading.Channels.ChannelReader<string> messages,
        CancellationToken cancellationToken
    )
    {
        await foreach (var message in messages.ReadAllAsync(cancellationToken))
        {
            await socket.SendAsync(
                Encoding.UTF8.GetBytes(message),
                WebSocketMessageType.Text,
                endOfMessage: true,
                cancellationToken
            );
        }
    }

    private static async Task WaitForDisconnectAsync(
        WebSocket socket,
        CancellationToken cancellationToken
    )
    {
        var buffer = new byte[1024];
        while (socket.State == WebSocketState.Open)
        {
            var received = await socket.ReceiveAsync(buffer, cancellationToken);
            if (received.MessageType == WebSocketMessageType.Close)
            {
                return;
            }
        }
    }

    private async Task<WebSocketCloseStatus> EnforceAccessAsync(
        DateTimeOffset sessionExpiresAt,
        Func<CancellationToken, Task<WebSocketCloseStatus?>> revalidate,
        CancellationToken cancellationToken
    )
    {
        while (
            sessionExpiresAt - timeProvider.GetUtcNow() is var remaining
            && remaining > TimeSpan.Zero
        )
        {
            await Task.Delay(
                remaining < RevalidateInterval ? remaining : RevalidateInterval,
                cancellationToken
            );
            if (
                timeProvider.GetUtcNow() < sessionExpiresAt
                && await revalidate(cancellationToken) is { } lost
            )
            {
                return lost;
            }
        }

        return ServiceRestart;
    }

    private async Task<bool> CanSeeRunAsync(
        UserId userId,
        TestRunId runId,
        CancellationToken cancellationToken
    )
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        return await dbContext.TestRuns.AnyAsync(
            run =>
                run.Id == runId
                && (
                    run.Project!.UserId == userId
                    || run.Project.Members.Any(member => member.UserId == userId)
                ),
            cancellationToken
        );
    }

    private async Task<IReadOnlySet<ProjectId>> VisibleProjectIdsAsync(
        UserId userId,
        CancellationToken cancellationToken
    )
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var ids = await dbContext
            .Projects.Where(project =>
                project.UserId == userId || project.Members.Any(member => member.UserId == userId)
            )
            .Select(project => project.Id)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    private static async Task CloseAsync(WebSocket socket, WebSocketCloseStatus status)
    {
        if (socket.State is WebSocketState.Open or WebSocketState.CloseReceived)
        {
            await socket.CloseOutputAsync(status, null, CancellationToken.None);
        }
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Live-update socket failed")]
    private static partial void LogRelayFailed(ILogger logger, Exception exception);
}
