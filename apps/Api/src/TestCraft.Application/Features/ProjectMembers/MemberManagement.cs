using TestCraft.Application.Common.Exceptions;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.ProjectMembers;

internal static class MemberManagement
{
    public static void EnsureCanManage(ProjectRole actor, params AssignableRole[] roles)
    {
        if (!roles.All(role => actor.CanManage(role)))
        {
            throw new ForbiddenException(
                "Only the project owner can grant, change or revoke the admin role",
                DomainErrorCodes.AdminRoleOwnerOnly
            );
        }
    }
}
