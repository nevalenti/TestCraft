using TestCraft.Application.Labels;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestCases;

public record TestCaseResponse
{
    public required Guid Id { get; init; }
    public required Guid SuiteId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required TestCasePriority Priority { get; init; }
    public required int StepCount { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
    public IReadOnlyList<LabelResponse> Labels { get; init; } = [];
}
