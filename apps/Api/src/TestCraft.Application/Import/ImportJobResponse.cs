using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public record ImportJobResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required ImportJobStatus Status { get; init; }
    public Guid? TestRunId { get; init; }
    public string? Error { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}
