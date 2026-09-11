using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

/// <summary>The outcome of executing one test case within a run.</summary>
public record TestResultResponse
{
    /// <summary>The result's identifier.</summary>
    public required TestResultId Id { get; init; }

    /// <summary>The run this result belongs to.</summary>
    public required TestRunId TestRunId { get; init; }

    /// <summary>The test case that was executed.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The suite the test case belongs to.</summary>
    public required TestSuiteId SuiteId { get; init; }

    /// <summary>The test case's name, denormalized for display.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>The result status.</summary>
    public required TestResultStatus Status { get; init; }

    /// <summary>Free-form notes, e.g. a failure message.</summary>
    public string? Notes { get; init; }

    /// <summary>How long the test took to execute, in milliseconds.</summary>
    public long? DurationMs { get; init; }

    /// <summary>The category of defect, when the result failed.</summary>
    public DefectType? DefectType { get; init; }

    /// <summary>When the test was executed.</summary>
    public required DateTimeOffset ExecutedAt { get; init; }

    /// <summary>The user who recorded the result, if any.</summary>
    public UserId? ExecutedById { get; init; }

    /// <summary>When the result was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the result was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
