using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Api.Extensions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.Hubs;

[Authorize]
public class TestRunHub(IApplicationDbContext db) : Hub
{
    public async Task JoinRun(string runId)
    {
        if (!Guid.TryParse(runId, out var runGuid) || !TryGetUserId(out var userId))
        {
            return;
        }

        var hasAccess = await db.Projects.AnyAsync(project =>
            (project.UserId == userId || project.Members.Any(member => member.UserId == userId))
            && db.TestRuns.Any(testRun => testRun.Id == runGuid && testRun.ProjectId == project.Id)
        );

        if (!hasAccess)
        {
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, $"run:{runGuid}");
    }

    public async Task LeaveRun(string runId)
    {
        if (!Guid.TryParse(runId, out var runGuid))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"run:{runGuid}");
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(Context.User?.GetUserId(), out userId);
}
