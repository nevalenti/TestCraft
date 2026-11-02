using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestSuites;

/// <summary>A suite grouping related test cases within a project.</summary>
public record TestSuiteResponse
{
    public static readonly Expression<Func<TestSuite, TestSuiteResponse>> Projection =
        suite => new TestSuiteResponse
        {
            Id = suite.Id,
            Version = suite.Version,
            ProjectId = suite.ProjectId,
            Name = suite.Name,
            Description = suite.Description,
            Source = suite.Source,
            CreatedAt = suite.CreatedAt,
            UpdatedAt = suite.UpdatedAt,
        };

    private static readonly Func<TestSuite, TestSuiteResponse> Map = Projection.Compile();

    public static TestSuiteResponse FromEntity(TestSuite suite) => Map(suite);

    /// <summary>The suite's identifier.</summary>
    public required TestSuiteId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The project the suite belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The suite's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The suite's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>Identifies the CI system or import source that created the suite, if any.</summary>
    public string? Source { get; init; }

    /// <summary>When the suite was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the suite was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
