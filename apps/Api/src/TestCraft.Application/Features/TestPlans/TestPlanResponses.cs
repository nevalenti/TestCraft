using System.Linq.Expressions;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

/// <summary>A test plan: a curated, ordered list of test cases across suites.</summary>
public record TestPlanResponse
{
    public static readonly Expression<Func<TestPlan, TestPlanResponse>> Projection =
        plan => new TestPlanResponse
        {
            Id = plan.Id,
            Version = plan.Version,
            Name = plan.Name,
            Description = plan.Description,
            ProjectId = plan.ProjectId,
            CaseCount = plan.TestPlanCases.Count(entry =>
                entry.TestCase != null && !entry.TestCase.IsDeleted
            ),
            CreatedAt = plan.CreatedAt,
        };

    /// <summary>The plan's identifier.</summary>
    public required TestPlanId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The plan's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The plan's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>The project the plan belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>The number of non-deleted test cases in the plan.</summary>
    public required int CaseCount { get; init; }

    /// <summary>When the plan was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }
}

/// <summary>A test plan including its ordered list of test cases.</summary>
public record TestPlanDetailResponse
{
    public static readonly Expression<Func<TestPlan, TestPlanDetailResponse>> Projection =
        plan => new TestPlanDetailResponse
        {
            Id = plan.Id,
            Version = plan.Version,
            Name = plan.Name,
            Description = plan.Description,
            ProjectId = plan.ProjectId,
            CreatedAt = plan.CreatedAt,
            Cases = plan
                .TestPlanCases.Where(entry => entry.TestCase != null)
                .OrderBy(entry => entry.Order)
                .ThenBy(entry => entry.TestCaseId)
                .Select(entry => new TestPlanCaseResponse
                {
                    TestCaseId = entry.TestCaseId,
                    TestCaseName = entry.TestCase!.Name,
                    SuiteName = entry.TestCase.Suite!.Name,
                    Order = entry.Order,
                })
                .ToList(),
        };

    /// <summary>The plan's identifier.</summary>
    public required TestPlanId Id { get; init; }

    /// <summary>Current version; the ETag header carries the same value.</summary>
    public required int Version { get; init; }

    /// <summary>The plan's display name.</summary>
    public required string Name { get; init; }

    /// <summary>The plan's description, if set.</summary>
    public string? Description { get; init; }

    /// <summary>The project the plan belongs to.</summary>
    public required ProjectId ProjectId { get; init; }

    /// <summary>When the plan was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>The test cases in the plan, in order.</summary>
    public required IReadOnlyList<TestPlanCaseResponse> Cases { get; init; }
}

/// <summary>A test case's position within a plan.</summary>
public record TestPlanCaseResponse
{
    /// <summary>The test case's identifier.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The test case's display name.</summary>
    public required string TestCaseName { get; init; }

    /// <summary>The name of the suite the test case belongs to.</summary>
    public required string SuiteName { get; init; }

    /// <summary>The test case's position within the plan.</summary>
    public required int Order { get; init; }
}
