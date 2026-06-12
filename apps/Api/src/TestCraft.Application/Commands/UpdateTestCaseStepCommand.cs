using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Responses;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Commands;

public record UpdateTestCaseStepCommand : IRequest<TestCaseStepResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required Guid Id { get; init; }
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
}

public class UpdateTestCaseStepCommandValidator : AbstractValidator<UpdateTestCaseStepCommand>
{
    public UpdateTestCaseStepCommandValidator()
    {
        RuleFor(x => x.Order).GreaterThanOrEqualTo(1);
        RuleFor(x => x.Action).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.ExpectedResult).NotEmpty().MaximumLength(2000);
    }
}

public class UpdateTestCaseStepCommandHandler(IApplicationDbContext context)
    : IRequestHandler<UpdateTestCaseStepCommand, TestCaseStepResponse>
{
    public async Task<TestCaseStepResponse> Handle(
        UpdateTestCaseStepCommand request,
        CancellationToken cancellationToken
    )
    {
        var step =
            await context.TestCaseSteps.FirstOrDefaultAsync(
                s => s.Id == request.Id && s.TestCaseId == request.CaseId,
                cancellationToken
            ) ?? throw new NotFoundException();

        step.Order = request.Order;
        step.Action = request.Action;
        step.ExpectedResult = request.ExpectedResult;

        await context.SaveChangesAsync(cancellationToken);

        return new TestCaseStepResponse
        {
            Id = step.Id,
            TestCaseId = step.TestCaseId,
            Order = step.Order,
            Action = step.Action,
            ExpectedResult = step.ExpectedResult,
            CreatedAt = step.CreatedAt,
            UpdatedAt = step.UpdatedAt,
        };
    }
}
