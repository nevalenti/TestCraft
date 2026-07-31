using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

/// <summary>A test run: an execution pass over a set of test cases.</summary>
public record TestRunResponse
{
    /// <summary>Maps a persisted run to its response representation.</summary>
    public static TestRunResponse FromEntity(TestRun run) =>
        new()
        {
            Id = run.Id,
            ProjectId = run.ProjectId,
            Name = run.Name,
            Environment = run.Environment,
            Status = run.Status,
            Source = run.Source,
            ExecutedById = run.ExecutedById,
            ExecutedByName = run.ExecutedByName,
            CreatedAt = run.CreatedAt,
            UpdatedAt = run.UpdatedAt,
        };

    /// <summary>The run's identifier.</summary>
    public required Guid Id { get; init; }

    /// <summary>The project the run belongs to.</summary>
    public required Guid ProjectId { get; init; }

    /// <summary>The run's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The environment the run was executed against.</summary>
    public required string Environment { get; init; }

    /// <summary>The run's current status.</summary>
    public required TestRunStatus Status { get; init; }

    /// <summary>Identifies the CI system or tool the run came from, if any.</summary>
    public string? Source { get; init; }

    /// <summary>The user who executed the run, if any.</summary>
    public Guid? ExecutedById { get; init; }

    /// <summary>The executing user's display name, denormalized for display.</summary>
    public string? ExecutedByName { get; init; }

    /// <summary>A presigned URL for the executing user's avatar, if set.</summary>
    public string? ExecutedByAvatarUrl { get; init; }

    /// <summary>When the run was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the run was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
