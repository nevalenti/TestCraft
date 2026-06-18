using AutoMapper;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestCaseSteps.Commands.CreateTestCaseStep;

public record CreateTestCaseStepCommand : IRequest<TestCaseStepResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid CaseId { get; init; }
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
}

public class CreateTestCaseStepCommandValidator : AbstractValidator<CreateTestCaseStepCommand>
{
    public CreateTestCaseStepCommandValidator()
    {
        RuleFor(x => x.Order).GreaterThanOrEqualTo(1);
        RuleFor(x => x.Action).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.ExpectedResult).NotEmpty().MaximumLength(2000);
    }
}

public class CreateTestCaseStepCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<CreateTestCaseStepCommand, TestCaseStepResponse>
{
    public async Task<TestCaseStepResponse> Handle(
        CreateTestCaseStepCommand request,
        CancellationToken cancellationToken
    )
    {
        var step = new TestCaseStep
        {
            TestCaseId = request.CaseId,
            Order = request.Order,
            Action = request.Action,
            ExpectedResult = request.ExpectedResult,
        };

        context.TestCaseSteps.Add(step);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<TestCaseStepResponse>(step);
    }
}
