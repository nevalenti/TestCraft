using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class BulkReorderSteps
{
    public sealed record StepOrder
    {
        public required Guid Id { get; init; }
        public required int Order { get; init; }
    }

    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid CaseId { get; init; }
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
