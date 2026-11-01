using System.Linq.Expressions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

/// <summary>A test run: an execution pass over a set of test cases.</summary>
public record TestRunResponse
{
    public static readonly Expression<Func<TestRun, TestRunResponse>> Projection =
        run => new TestRunResponse
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
            Version = run.Version,
        };

    private static readonly Func<TestRun, TestRunResponse> Map = Projection.Compile();

    public static TestRunResponse FromEntity(TestRun run) => Map(run);

    /// <summary>The run's identifier.</summary>
    public required TestRunId Id { get; init; }

    /// <summary>The project the run belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The run's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The environment the run was executed against.</summary>
    public required string Environment { get; init; }

    /// <summary>The run's current status.</summary>
    public required TestRunStatus Status { get; init; }

    /// <summary>Identifies the CI system or tool the run came from, if any.</summary>
    public string? Source { get; init; }

    /// <summary>The user who executed the run, if any.</summary>
    public UserId? ExecutedById { get; init; }

    /// <summary>The executing user's display name, denormalized for display.</summary>
    public string? ExecutedByName { get; init; }

    /// <summary>When the run was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the run was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    /// <summary>Revision used for conditional updates.</summary>
    public required int Version { get; init; }
}
