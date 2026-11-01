using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.ProjectMembers;

/// <summary>A user with collaborator access to a project.</summary>
public record ProjectMemberResponse
{
    public static ProjectMemberResponse FromEntity(ProjectMember member) =>
        new()
        {
            Id = member.Id,
            Email = member.Email,
            DisplayName = member.DisplayName,
            Role = member.Role,
            CreatedAt = member.CreatedAt,
        };

    /// <summary>The membership's identifier.</summary>
    public required ProjectMemberId Id { get; init; }

    /// <summary>The member's email address.</summary>
    public required string? Email { get; init; }

    /// <summary>The member's display name, if set.</summary>
    public required string? DisplayName { get; init; }

    /// <summary>The member's role in the project.</summary>
    public required AssignableRole Role { get; init; }

    /// <summary>When the member was added to the project.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}
