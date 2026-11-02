using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestCaseSteps;

/// <summary>One step of a test case: an action and its expected result.</summary>
public record TestCaseStepResponse
{
    public static readonly Expression<Func<TestCaseStep, TestCaseStepResponse>> Projection =
        step => new TestCaseStepResponse
        {
            Id = step.Id,
            Version = step.Version,
            TestCaseId = step.TestCaseId,
            Order = step.Order,
            Action = step.Action,
            ExpectedResult = step.ExpectedResult,
            CreatedAt = step.CreatedAt,
            UpdatedAt = step.UpdatedAt,
        };

    private static readonly Func<TestCaseStep, TestCaseStepResponse> Map = Projection.Compile();

    public static TestCaseStepResponse FromEntity(TestCaseStep step) => Map(step);

    /// <summary>The step's identifier.</summary>
    public required TestCaseStepId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The test case the step belongs to.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The step's position within the test case.</summary>
    public required int Order { get; init; }

    /// <summary>The action to perform.</summary>
    public required string Action { get; init; }

    /// <summary>The result expected after performing the action.</summary>
    public required string ExpectedResult { get; init; }

    /// <summary>When the step was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the step was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
