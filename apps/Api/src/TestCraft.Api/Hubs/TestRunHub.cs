using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Hubs;

[Authorize]
public class TestRunHub(IApplicationDbContext db) : Hub
{
    public async Task JoinRun(string runId)
    {
        var userId = TryGetUserId();
        if (!TestRunId.TryParse(runId, out var parsedRunId) || userId is null)
        {
            return;
        }

        var hasAccess = await db.Projects.AnyAsync(project =>
            (project.UserId == userId || project.Members.Any(member => member.UserId == userId))
            && db.TestRuns.Any(testRun =>
                testRun.Id == parsedRunId && testRun.ProjectId == project.Id
            )
        );

        if (!hasAccess)
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"run:{parsedRunId}");
    }

    public async Task LeaveRun(string runId)
    {
        if (!TestRunId.TryParse(runId, out var parsedRunId))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"run:{parsedRunId}");
    }

    private UserId? TryGetUserId() =>
        UserId.TryParse(Context.User?.GetUserIdOrNull(), out var userId) ? userId : null;
}
