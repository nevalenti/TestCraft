using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Common.Security;

internal static class ProjectOwnershipGuard
{
    public static async Task EnsureOwnerAsync(
        IApplicationDbContext context,
        Guid projectId,
        Guid userId,
        CancellationToken cancellationToken
    )
    {
        var isOwner = await context.Projects.AnyAsync(
            p => p.Id == projectId && p.UserId == userId,
            cancellationToken
        );

        if (!isOwner)
            throw new NotFoundException();
    }
}
