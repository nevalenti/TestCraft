using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
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
        var isOwner = await context.Projects.AnyAsync(
            project => project.Id == projectId && project.UserId == userId,
            cancellationToken
        );

        if (!isOwner)
            throw new NotFoundException();
    }
}
