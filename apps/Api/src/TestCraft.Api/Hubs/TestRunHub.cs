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
        var userId = TryGetUserId();
        if (!Guid.TryParse(runId, out var runGuid) || userId is null)
        {
            return;
        }

        var parsedRunId = TestRunId.From(runGuid);

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
        if (!Guid.TryParse(runId, out var runGuid))
        {
            return;
        }

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"run:{TestRunId.From(runGuid)}");
    }

    private UserId? TryGetUserId() =>
        Guid.TryParse(Context.User?.GetUserIdOrNull(), out var guid) ? UserId.From(guid) : null;
}
