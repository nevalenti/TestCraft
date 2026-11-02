using System.Linq.Expressions;
using TestCraft.Application.Features.Labels;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestCases;

/// <summary>A test case: a named, prioritized check with ordered steps.</summary>
public record TestCaseResponse
{
    public static readonly Expression<Func<TestCase, TestCaseResponse>> Projection =
        testCase => new TestCaseResponse
        {
            Id = testCase.Id,
            Version = testCase.Version,
            SuiteId = testCase.SuiteId,
            Name = testCase.Name,
            Description = testCase.Description,
            Priority = testCase.Priority,
            StepCount = testCase.Steps.Count(step => !step.IsDeleted),
            CreatedAt = testCase.CreatedAt,
            UpdatedAt = testCase.UpdatedAt,
            Labels = testCase
                .TestCaseLabels.OrderBy(link => link.Label!.Name)
                .Select(link => new LabelResponse
                {
                    Id = link.Label!.Id,
                    Version = link.Label.Version,
                    Name = link.Label.Name,
                    Color = link.Label.Color,
                    ProjectId = link.Label.ProjectId,
                })
                .ToList(),
        };

    /// <summary>The test case's identifier.</summary>
    public required TestCaseId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The suite the test case belongs to.</summary>
    public required TestSuiteId SuiteId { get; init; }

    /// <summary>The test case's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The test case's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>The test case's priority.</summary>
    public required TestCasePriority Priority { get; init; }

    /// <summary>The number of non-deleted steps in the test case.</summary>
    public required int StepCount { get; init; }

    /// <summary>When the test case was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the test case was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }

    /// <summary>The labels attached to the test case.</summary>
    public IReadOnlyList<LabelResponse> Labels { get; init; } = [];
}
