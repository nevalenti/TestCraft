using System.Linq.Expressions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Responses;

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

    internal static readonly Expression<Func<TestCase, TestCaseResponse>> Projection =
        c => new TestCaseResponse
        {
            Id = c.Id,
            SuiteId = c.SuiteId,
            Name = c.Name,
            Description = c.Description,
            Priority = c.Priority,
            StepCount = c.Steps.Count(s => !s.IsDeleted),
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt,
        };
}
