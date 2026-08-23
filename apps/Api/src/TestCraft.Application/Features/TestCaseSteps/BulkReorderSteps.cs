using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class BulkReorderSteps
{
    /// <summary>The new position for a single step.</summary>
    public sealed record StepOrder
    {
        /// <summary>The step to reorder.</summary>
        public required TestCaseStepId Id { get; init; }

        /// <summary>The step's new order position.</summary>
        public required int Order { get; init; }
    }

    /// <summary>Reorders all steps of a test case in one operation.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The test case whose steps are being reordered.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public TestCaseId CaseId { get; init; }

        /// <summary>The new order for every step. Must cover all existing steps.</summary>
        public required IReadOnlyList<StepOrder> Steps { get; init; }
    }

    public sealed class StepOrderValidator : AbstractValidator<StepOrder>
    {
        public StepOrderValidator()
        {
            RuleFor(stepOrder => stepOrder.Order).GreaterThanOrEqualTo(1);
        }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Steps).NotEmpty();
            RuleForEach(command => command.Steps).SetValidator(new StepOrderValidator());
            RuleFor(command => command.Steps)
                .Must(steps =>
                    steps.Select(stepOrder => stepOrder.Id).Distinct().Count() == steps.Count
                )
                .WithMessage("Duplicate step IDs are not allowed")
                .When(command => command.Steps.Count > 0);
        }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var caseExists = await context.TestCases.AnyAsync(
                testCase =>
                    testCase.Id == request.CaseId && testCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!caseExists)
            {
                throw new NotFoundException();
            }

            var ids = request.Steps.Select(stepOrder => stepOrder.Id).ToList();

            var found = await context
                .TestCaseSteps.Where(step =>
                    step.TestCaseId == request.CaseId && ids.Contains(step.Id)
                )
                .Select(step => step.Id)
                .ToListAsync(cancellationToken);

            if (found.Count != ids.Count)
            {
                throw new DomainException("One or more steps not found");
            }

            var entities = await context
                .TestCaseSteps.Where(step => ids.Contains(step.Id))
                .ToListAsync(cancellationToken);
            var orderById = request.Steps.ToDictionary(
                stepOrder => stepOrder.Id,
                stepOrder => stepOrder.Order
            );

            foreach (var entity in entities)
            {
                entity.Order = orderById[entity.Id];
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
