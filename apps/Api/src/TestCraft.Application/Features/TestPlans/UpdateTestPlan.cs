using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;

namespace TestCraft.Application.Features.TestPlans;

public static class UpdateTestPlan
{
    /// <summary>Updates a test plan's name and description.</summary>
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestPlanId Id { get; init; }

        /// <summary>The plan's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The plan's new description.</summary>
        public string? Description { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).RequiredName();
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
            var plan = await context.TestPlans.FirstOrNotFoundAsync(
                existingPlan =>
                    existingPlan.Id == request.Id && existingPlan.ProjectId == request.ProjectId,
                cancellationToken
            );

            VersionCheck.Ensure(plan, request.ExpectedVersion);
            plan.Update(request.Name, request.Description);

            await context.SaveChangesAsync(cancellationToken);

            return await TestPlanResponse.LoadAsync(context, plan.Id, cancellationToken);
        }
    }
}
