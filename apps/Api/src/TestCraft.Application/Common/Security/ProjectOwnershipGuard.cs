using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Common.Security;

internal static class ProjectOwnershipGuard
{
    public static async Task EnsureOwnerAsync(
        IApplicationDbContext context,
        ProjectId projectId,
        UserId userId,
        CancellationToken cancellationToken
    )
    {
        await context.Projects.EnsureExistsAsync(
            project => project.Id == projectId && project.UserId == userId,
            cancellationToken
        );
    }
}
