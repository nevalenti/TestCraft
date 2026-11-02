using System.Linq.Expressions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Projects;

/// <summary>A project that groups suites, plans, and runs.</summary>
public record ProjectResponse
{
    /// <summary>The project's identifier.</summary>
    public required ProjectId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The project's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The project's description, if set.</summary>
    public required string? Description { get; init; }

    /// <summary>When the project was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the project was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The number of non-deleted suites in the project.</summary>
    public required int SuiteCount { get; init; }

    /// <summary>The number of non-deleted runs in the project.</summary>
    public required int RunCount { get; init; }

    /// <summary>Whether the current user owns the project, as opposed to being a member.</summary>
    public required bool IsOwner { get; init; }

    /// <summary>The current user's role in the project.</summary>
    public required ProjectRole Role { get; init; }

    /// <summary>When the most recent run was created, if there is one.</summary>
    public DateTimeOffset? LastRunAt { get; init; }

    /// <summary>Pass rates of the most recent runs, 0 to 100.</summary>
    public IReadOnlyList<decimal> RecentPassRates { get; init; } = [];

    public static Expression<Func<Project, ProjectResponse>> For(UserId userId) =>
        project => new ProjectResponse
        {
            Id = project.Id,
            Version = project.Version,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            SuiteCount = project.TestSuites.Count(suite => !suite.IsDeleted),
            RunCount = project.TestRuns.Count(run => !run.IsDeleted),
            IsOwner = project.UserId == userId,
            Role = ProjectRoles.Resolve(
                project.UserId == userId,
                project
                    .Members.Where(member => member.UserId == userId)
                    .Select(member => (AssignableRole?)member.Role)
                    .FirstOrDefault()
            ),
            LastRunAt = project
                .TestRuns.Where(run => !run.IsDeleted)
                .Max(run => (DateTimeOffset?)run.CreatedAt),
        };
}
