using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestResults;

/// <summary>The outcome of executing one test case within a run.</summary>
public record TestResultResponse : IVersionedResponse
{
    public static Task<TestResultResponse> LoadAsync(
        IApplicationDbContext context,
        TestResultId id,
        CancellationToken cancellationToken
    ) =>
        context
            .LiveResults()
            .Where(result => result.Id == id)
            .Select(Projection)
            .FirstAsync(cancellationToken);

    public static readonly Expression<Func<TestResult, TestResultResponse>> Projection =
        result => new TestResultResponse
        {
            Id = result.Id,
            Version = result.Version,
            TestRunId = result.TestRunId,
            TestCaseId = result.TestCaseId,
            SuiteId = result.TestCase!.SuiteId,
            TestCaseName = result.TestCase.Name,
            Status = result.Status,
            Notes = result.Notes,
            DurationMs = result.DurationMs,
            DefectType = result.DefectType,
            DefectUrl = result.DefectUrl,
            ExecutedAt = result.ExecutedAt,
            ExecutedById = result.ExecutedById,
            CreatedAt = result.CreatedAt,
            UpdatedAt = result.UpdatedAt,
        };

    /// <summary>The result's identifier.</summary>
    public required TestResultId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

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

    /// <summary>A link to the issue tracking the defect, if one was added.</summary>
    public string? DefectUrl { get; init; }

    /// <summary>When the test was executed.</summary>
    public required DateTimeOffset? ExecutedAt { get; init; }

    /// <summary>The user who recorded the result, if any.</summary>
    public UserId? ExecutedById { get; init; }

    /// <summary>When the result was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the result was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
