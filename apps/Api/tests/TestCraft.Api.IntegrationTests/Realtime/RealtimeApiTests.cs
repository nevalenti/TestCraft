using System.Net;
using System.Net.Http.Headers;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using TestCraft.Api.IntegrationTests.Infrastructure;
using TestCraft.Api.Realtime;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Api.IntegrationTests.Realtime;

[Collection(ApiCollection.Name)]
public class RealtimeApiTests(ApiFactory factory)
{
    private static readonly TimeSpan ReceiveTimeout = TimeSpan.FromSeconds(10);

    private HttpClient CreateClient(Guid userId)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            userId.ToString()
        );

        return client;
    }

    [Fact]
    public async Task RunSocket_ReceivesResultsLogsAndStatus()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var suite = await client.CreateSuiteAsync(project.Id);
        var testCase = await client.CreateCaseAsync(project.Id, suite.Id);
        var run = await client.CreateRunAsync(project.Id);
        using var socket = await ConnectAsync(
            $"/ws/runs/{run.Id}",
            await TicketAsync(client, $"/api/v1/projects/{project.Id}/runs/{run.Id}/ws-ticket")
        );

        var result = await client.CreateResultAsync(project.Id, run.Id, testCase.Id);
        var added = await ReceiveAsync(socket);
        await client.PostAsJsonAsync(
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/logs",
            new AppendRunLogs.Command { Lines = ["first", "second"] }
        );
        var logs = await ReceiveAsync(socket);
        await client.CompleteRunAsync(project.Id, run);
        var status = await ReceiveAsync(socket);

        added.GetProperty("event").GetString().Should().Be("result.added");
        added.GetProperty("data").GetProperty("id").GetString().Should().Be(result.Id.ToString());
        logs.GetProperty("event").GetString().Should().Be("logs.appended");
        logs.GetProperty("data").GetProperty("count").GetInt32().Should().Be(2);
        logs.GetProperty("data").GetProperty("last_seq").GetInt64().Should().BePositive();
        logs.GetProperty("data").GetProperty("lines")[1].GetString().Should().Be("second");
        status.GetProperty("event").GetString().Should().Be("run.status_changed");
        status.GetProperty("data").GetString().Should().Be("completed");
    }

    [Fact]
    public async Task DashboardSocket_ReceivesRunChangesForVisibleProjects()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        using var socket = await ConnectAsync(
            "/ws/dashboard",
            await TicketAsync(client, "/api/v1/projects/dashboard/ws-ticket")
        );

        var run = await client.CreateRunAsync(project.Id);
        var changed = await ReceiveAsync(socket);

        changed.GetProperty("event").GetString().Should().Be("run.changed");
        changed
            .GetProperty("data")
            .GetProperty("project_id")
            .GetString()
            .Should()
            .Be(project.Id.ToString());
        changed
            .GetProperty("data")
            .GetProperty("run_id")
            .GetString()
            .Should()
            .Be(run.Id.ToString());
    }

    [Fact]
    public async Task Ticket_WorksOnlyOnceAndOnlyForItsRun()
    {
        var client = CreateClient(Guid.NewGuid());
        var project = await client.CreateProjectAsync();
        var run = await client.CreateRunAsync(project.Id);
        var other = await client.CreateRunAsync(project.Id);
        var ticket = await TicketAsync(
            client,
            $"/api/v1/projects/{project.Id}/runs/{run.Id}/ws-ticket"
        );

        using var wrongRun = await ConnectAsync($"/ws/runs/{other.Id}", ticket);
        using var reused = await ConnectAsync($"/ws/runs/{run.Id}", ticket);

        (await CloseStatusAsync(wrongRun)).Should().Be(WebSocketCloseStatus.PolicyViolation);
        (await CloseStatusAsync(reused)).Should().Be(WebSocketCloseStatus.PolicyViolation);
    }

    [Fact]
    public async Task Ticket_ForStrangersRun_IsNotFound()
    {
        var owner = CreateClient(Guid.NewGuid());
        var project = await owner.CreateProjectAsync();
        var run = await owner.CreateRunAsync(project.Id);

        var response = await CreateClient(Guid.NewGuid())
            .PostAsync($"/api/v1/projects/{project.Id}/runs/{run.Id}/ws-ticket", null);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<string> TicketAsync(HttpClient client, string path)
    {
        var response = await client.PostAsync(path, null);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        return (await response.Content.ReadFromJsonAsync<SocketTicketResponse>())!.Ticket;
    }

    private async Task<WebSocket> ConnectAsync(string path, string ticket) =>
        await factory
            .Server.CreateWebSocketClient()
            .ConnectAsync(
                new Uri(factory.Server.BaseAddress, $"{path}?ticket={ticket}"),
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
