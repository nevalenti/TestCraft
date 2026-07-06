using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class BulkReorderSteps
{
    /// <summary>The new position for a single step.</summary>
    public sealed record StepOrder
    {
        /// <summary>The step to reorder.</summary>
        public required Guid Id { get; init; }

        /// <summary>The step's new order position.</summary>
        public required int Order { get; init; }
    }

    /// <summary>Reorders all steps of a test case in one operation.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The test case whose steps are being reordered.</summary>
        public Guid CaseId { get; init; }

        /// <summary>The new order for every step. Must cover all existing steps.</summary>
        public required IReadOnlyList<StepOrder> Steps { get; init; }
    }

    public sealed class StepOrderValidator : AbstractValidator<StepOrder>
    {
        public StepOrderValidator()
        {
            RuleFor(x => x.Order).GreaterThanOrEqualTo(1);
        }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Steps).NotEmpty();
            RuleForEach(x => x.Steps).SetValidator(new StepOrderValidator());
            RuleFor(x => x.Steps)
                .Must(steps => steps.Select(s => s.Id).Distinct().Count() == steps.Count)
                .WithMessage("Duplicate step IDs are not allowed")
                .When(x => x.Steps.Count > 0);
        }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var ids = request.Steps.Select(s => s.Id).ToList();

            var found = await context
                .TestCaseSteps.Where(s => s.TestCaseId == request.CaseId && ids.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);

            if (found.Count != ids.Count)
            {
                throw new DomainException("One or more steps not found");
            }

            var entities = await context
                .TestCaseSteps.Where(s => ids.Contains(s.Id))
                .ToListAsync(cancellationToken);
            var orderById = request.Steps.ToDictionary(s => s.Id, s => s.Order);

            foreach (var entity in entities)
            {
                entity.Order = orderById[entity.Id];
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
