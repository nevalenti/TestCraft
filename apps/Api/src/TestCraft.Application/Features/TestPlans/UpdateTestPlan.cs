using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestPlans;

public static class UpdateTestPlan
{
    /// <summary>Updates a test plan's name and description.</summary>
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to update.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestPlanId Id { get; init; }

        /// <summary>The plan's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The plan's new description.</summary>
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
            var plan =
                await context.TestPlans.FirstOrDefaultAsync(
                    existingPlan =>
                        existingPlan.Id == request.Id
                        && existingPlan.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            plan.Name = request.Name;
            plan.Description = request.Description;

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestPlans.Where(updatedPlan => updatedPlan.Id == plan.Id)
                .Select(updatedPlan => new TestPlanResponse
                {
                    Id = updatedPlan.Id,
                    Name = updatedPlan.Name,
                    Description = updatedPlan.Description,
                    ProjectId = updatedPlan.ProjectId,
                    CaseCount = updatedPlan.TestPlanCases.Count(tpc =>
                        tpc.TestCase != null && !tpc.TestCase.IsDeleted
                    ),
                    CreatedAt = updatedPlan.CreatedAt,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
