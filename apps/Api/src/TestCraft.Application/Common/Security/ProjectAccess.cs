using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Common.Security;

public sealed class ProjectAccess(IApplicationDbContext context, ICurrentUser currentUser)
{
    private readonly Dictionary<ProjectId, ProjectRole?> _roles = [];

    public async Task<ProjectRole?> RoleOfAsync(
        ProjectId projectId,
        CancellationToken cancellationToken
    )
    {
        if (_roles.TryGetValue(projectId, out var known))
        {
            return known;
        }

        var userId = currentUser.UserId;
        var access = await context
            .Projects.Where(project => project.Id == projectId)
            .Select(project => new
            {
                IsOwner = project.UserId == userId,
                MemberRole = project
                    .Members.Where(member => member.UserId == userId)
                    .Select(member => (AssignableRole?)member.Role)
                    .FirstOrDefault(),
            })
            .FirstOrDefaultAsync(cancellationToken);

        var role = access is { IsOwner: true } or { MemberRole: not null }
            ? ProjectRoles.Resolve(access.IsOwner, access.MemberRole)
            : (ProjectRole?)null;
        _roles[projectId] = role;

        return role;
    }
}
