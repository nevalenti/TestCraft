using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

public static class CreateTestPlan
{
    /// <summary>Creates a new, empty test plan in a project.</summary>
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the plan in.</summary>
        [JsonIgnore]
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
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
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
            var plan = TestPlan.Create(request.Name, request.Description, request.ProjectId);

            context.TestPlans.Add(plan);

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestPlans.Where(createdPlan => createdPlan.Id == plan.Id)
                .Select(TestPlanResponse.Projection)
                .FirstAsync(cancellationToken);
        }
    }
}
