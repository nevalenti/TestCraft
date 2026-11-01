using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using StackExchange.Redis;
using Testcontainers.Redis;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Api.Realtime;

namespace TestCraft.Api.IntegrationTests.Realtime;

[Collection(ApiCollection.Name)]
public sealed class RedisRealtimeTests(ApiFactory factory) : IAsyncLifetime
{
    private static readonly TimeSpan ReceiveTimeout = TimeSpan.FromSeconds(10);

    private readonly RedisContainer _redis = new RedisBuilder("redis:7-alpine").Build();

    private ConnectionMultiplexer _probe = null!;

    public async Task InitializeAsync()
    {
        await _redis.StartAsync();
        _probe = await ConnectionMultiplexer.ConnectAsync(_redis.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        await _probe.DisposeAsync();
        await _redis.DisposeAsync();
    }

    [Fact]
    public async Task EventsAndTickets_CrossInstances()
    {
        await using var first = Instance();
        await using var second = Instance();
        var userId = Guid.NewGuid();
        var onFirst = Client(first, userId);
        _ = Client(second, userId);
        await WaitForRelaysAsync(expectedInstances: 2);

        var project = await onFirst.CreateProjectAsync();
        var suite = await onFirst.CreateSuiteAsync(project.Id);
        var testCase = await onFirst.CreateCaseAsync(project.Id, suite.Id);
        var run = await onFirst.CreateRunAsync(project.Id);
        var runTicket = await TicketAsync(
            onFirst,
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/ws-ticket"
        );
        var dashboardTicket = await TicketAsync(onFirst, "/api/v1/projects/dashboard/ws-ticket");
        using var runSocket = await ConnectAsync(second, $"/ws/runs/{run.Id}", runTicket);
        using var dashboardSocket = await ConnectAsync(second, "/ws/dashboard", dashboardTicket);

        var result = await onFirst.CreateResultAsync(project.Id, run.Id, testCase.Id);
        var added = await ReceiveAsync(runSocket);
        var changed = await ReceiveAsync(dashboardSocket);

        added.GetProperty("event").GetString().Should().Be("result.added");
        added.GetProperty("data").GetProperty("id").GetString().Should().Be(result.Id.ToString());
        changed.GetProperty("event").GetString().Should().Be("run.changed");
        changed
            .GetProperty("data")
            .GetProperty("run_id")
            .GetString()
            .Should()
            .Be(run.Id.ToString());

        using var reused = await ConnectAsync(first, $"/ws/runs/{run.Id}", runTicket);
        (await CloseStatusAsync(reused)).Should().Be(WebSocketCloseStatus.PolicyViolation);
    }

    [Fact]
    public async Task ConnectionCap_CountsSocketsOnEveryInstance()
    {
        await using var first = Instance(maxConnectionsPerUser: 1);
        await using var second = Instance(maxConnectionsPerUser: 1);
        var userId = Guid.NewGuid();
        var onFirst = Client(first, userId);
        var onSecond = Client(second, userId);

        using var open = await ConnectAsync(
            first,
            "/ws/dashboard",
            await TicketAsync(onFirst, "/api/v1/projects/dashboard/ws-ticket")
        );
        using var refused = await ConnectAsync(
            second,
            "/ws/dashboard",
            await TicketAsync(onSecond, "/api/v1/projects/dashboard/ws-ticket")
        );

        (await CloseStatusAsync(refused)).Should().Be((WebSocketCloseStatus)1013);
        open.State.Should().Be(WebSocketState.Open);
    }

    private WebApplicationFactory<Program> Instance(int maxConnectionsPerUser = 20) =>
        factory.WithWebHostBuilder(builder =>
        {
            builder.UseSetting("REDIS_URL", $"redis://{_redis.GetConnectionString()}");
            builder.UseSetting(
                "WS_MAX_CONNECTIONS_PER_USER",
                maxConnectionsPerUser.ToString(CultureInfo.InvariantCulture)
            );
        });

    private static HttpClient Client(WebApplicationFactory<Program> instance, Guid userId)
    {
        var client = instance.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );

        return client;
    }

    private async Task WaitForRelaysAsync(int expectedInstances)
    {
        var server = _probe.GetServers()[0];
        using var timeout = new CancellationTokenSource(ReceiveTimeout);
        while (
            (await server.ExecuteAsync("CLIENT", "LIST", "TYPE", "pubsub"))
                .ToString()
                .Split('\n')
                .Count(client => client.Contains(" psub=2 ", StringComparison.Ordinal))
            < expectedInstances
        )
        {
            await Task.Delay(50, timeout.Token);
        }
    }

    private static async Task<string> TicketAsync(HttpClient client, string path)
    {
        var response = await client.PostAsync(path, null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        return (await response.Content.ReadFromJsonAsync<SocketTicketResponse>())!.Ticket;
    }

    private static Task<WebSocket> ConnectAsync(
        WebApplicationFactory<Program> instance,
        string path,
        string ticket
    ) =>
        instance
            .Server.CreateWebSocketClient()
            .ConnectAsync(
                new Uri(instance.Server.BaseAddress, $"{path}?ticket={ticket}"),
                CancellationToken.None
            );

    private static async Task<JsonElement> ReceiveAsync(WebSocket socket)
    {
        using var timeout = new CancellationTokenSource(ReceiveTimeout);
        var buffer = new byte[64 * 1024];
        var received = await socket.ReceiveAsync(buffer, timeout.Token);
        received.MessageType.Should().Be(WebSocketMessageType.Text);

        return JsonDocument.Parse(Encoding.UTF8.GetString(buffer, 0, received.Count)).RootElement;
    }

    private static async Task<WebSocketCloseStatus?> CloseStatusAsync(WebSocket socket)
    {
        using var timeout = new CancellationTokenSource(ReceiveTimeout);
        var received = await socket.ReceiveAsync(new byte[1024], timeout.Token);
        received.MessageType.Should().Be(WebSocketMessageType.Close);

        return received.CloseStatus;
    }
}
