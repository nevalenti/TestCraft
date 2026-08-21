using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

/// <summary>A test plan: a curated, ordered list of test cases across suites.</summary>
public record TestPlanResponse
{
    /// <summary>The plan's identifier.</summary>
    public required TestPlanId Id { get; init; }

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
    /// <summary>The plan's identifier.</summary>
    public required TestPlanId Id { get; init; }

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

public static class CreateTestPlan
{
    /// <summary>Creates a new, empty test plan in a project.</summary>
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the plan in.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The plan's description.</summary>
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(255);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestPlanResponse>
    {
        public async Task<TestPlanResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var plan = new TestPlan
            {
                Id = TestPlanId.New(),
                Name = request.Name,
                Description = request.Description,
                ProjectId = request.ProjectId,
            };

            context.TestPlans.Add(plan);
            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestPlans.Where(createdPlan => createdPlan.Id == plan.Id)
                .Select(createdPlan => new TestPlanResponse
                {
                    Id = createdPlan.Id,
                    Name = createdPlan.Name,
                    Description = createdPlan.Description,
                    ProjectId = createdPlan.ProjectId,
                    CaseCount = 0,
                    CreatedAt = createdPlan.CreatedAt,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
