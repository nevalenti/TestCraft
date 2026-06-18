using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps.Commands.UpdateTestCaseStep;

public record UpdateTestCaseStepCommand : IRequest<TestCaseStepResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid CaseId { get; init; }
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

public class UpdateTestCaseStepCommandHandler(IApplicationDbContext context, IMapper mapper)
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

        return mapper.Map<TestCaseStepResponse>(step);
    }
}
