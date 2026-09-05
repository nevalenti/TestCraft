using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Import;

/// <summary>The status of a report import job, processed asynchronously.</summary>
public record ImportJobResponse
{
    /// <summary>The import job's identifier.</summary>
    public required ImportJobId Id { get; init; }

    /// <summary>The project the import job belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The job's current processing status.</summary>
    public required ImportJobStatus Status { get; init; }

    /// <summary>The run created from this import, once processing succeeds.</summary>
    public TestRunId? TestRunId { get; init; }

    /// <summary>The failure message, if the job failed.</summary>
    public string? Error { get; init; }

    /// <summary>When the import job was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the import job was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}
