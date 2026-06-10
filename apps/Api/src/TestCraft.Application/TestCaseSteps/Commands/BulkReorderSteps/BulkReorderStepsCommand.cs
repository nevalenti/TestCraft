using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.TestCaseSteps.Commands.BulkReorderSteps;

public record ReorderStepInput
{
    public required Guid Id { get; init; }
    public required int Order { get; init; }
}

public record BulkReorderStepsCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required IReadOnlyList<ReorderStepInput> Steps { get; init; }
}

public class ReorderStepInputValidator : AbstractValidator<ReorderStepInput>
{
    public ReorderStepInputValidator()
    {
        RuleFor(x => x.Order).GreaterThanOrEqualTo(1);
    }
}

public class BulkReorderStepsCommandValidator
    : AbstractValidator<BulkReorderStepsCommand>
{
    public BulkReorderStepsCommandValidator()
    {
        RuleFor(x => x.Steps).NotEmpty();
        RuleForEach(x => x.Steps).SetValidator(new ReorderStepInputValidator());
        RuleFor(x => x.Steps)
            .Must(steps =>
                steps.Select(s => s.Id).Distinct().Count() == steps.Count
            )
            .WithMessage("Duplicate step IDs are not allowed")
            .When(x => x.Steps.Count > 0);
    }
}

public class BulkReorderStepsCommandHandler(IApplicationDbContext context)
    : IRequestHandler<BulkReorderStepsCommand>
{
    public async Task Handle(
        BulkReorderStepsCommand request,
        CancellationToken cancellationToken
    )
    {
        var ids = request.Steps.Select(s => s.Id).ToList();

        var found = await context
            .TestCaseSteps.Where(s =>
                s.TestCaseId == request.CaseId && ids.Contains(s.Id)
            )
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
