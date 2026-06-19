using Microsoft.AspNetCore.SignalR;

namespace TestCraft.Api.Hubs;

public class TestRunHub : Hub
{
    public async Task JoinRun(string runId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"run:{runId}");
    }

    public async Task LeaveRun(string runId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"run:{runId}");
    }
}
