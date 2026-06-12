using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestCaseSteps;

public record TestCaseStepResponse
{
    public required Guid Id { get; init; }
    public required Guid TestCaseId { get; init; }
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }

    internal static readonly Expression<Func<TestCaseStep, TestCaseStepResponse>> Projection =
        s => new TestCaseStepResponse
        {
            Id = s.Id,
            TestCaseId = s.TestCaseId,
            Order = s.Order,
            Action = s.Action,
            ExpectedResult = s.ExpectedResult,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt,
        };
}
