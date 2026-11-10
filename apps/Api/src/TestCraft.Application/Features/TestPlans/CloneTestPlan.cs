using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestPlans;

public static class CloneTestPlan
{
    /// <summary>Copies a test plan, with its cases in order, within the project. Plans can't move between projects because their cases belong to one.</summary>
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        /// <summary>The project the plan belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The plan to copy.</summary>
        [JsonIgnore]
        public TestPlanId Id { get; init; }

        /// <summary>The copy's name. Null keeps the source name, adding "(copy)" if it is taken.</summary>
        public string? Name { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).MaximumLength(FieldLengths.Name);
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
            var source =
                await context
                    .TestPlans.Include(plan => plan.TestPlanCases)
                    .FirstOrDefaultAsync(
                        plan => plan.Id == request.Id && plan.ProjectId == request.ProjectId,
                        cancellationToken
                    )
                ?? throw new NotFoundException();

            var name = request.Name;
            if (name is null)
            {
                var taken = await context
                    .TestPlans.Where(plan => plan.ProjectId == request.ProjectId)
                    .Select(plan => plan.Name)
                    .ToListAsync(cancellationToken);
                name = CopyName.FirstFree(source.Name, taken.ToHashSet());
            }

            var copy = TestPlan.Create(name, source.Description, request.ProjectId);
            context.TestPlans.Add(copy);
            foreach (var planCase in source.TestPlanCases)
            {
                context.TestPlanCases.Add(
                    TestPlanCase.Create(copy.Id, planCase.TestCaseId, planCase.Order)
                );
            }

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestPlans.Where(created => created.Id == copy.Id)
                .Select(TestPlanResponse.Projection)
                .FirstAsync(cancellationToken);
        }
    }
}
