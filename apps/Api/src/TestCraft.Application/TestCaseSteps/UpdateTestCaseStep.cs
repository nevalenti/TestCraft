using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class UpdateTestCaseStep
{
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid CaseId { get; init; }
        public Guid Id { get; init; }
        public required int Order { get; init; }
        public required string Action { get; init; }
        public required string ExpectedResult { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Order).GreaterThanOrEqualTo(1);
            RuleFor(x => x.Action).NotEmpty().MaximumLength(2000);
            RuleFor(x => x.ExpectedResult).NotEmpty().MaximumLength(2000);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestCaseStepResponse>
    {
        public async Task<TestCaseStepResponse> Handle(
            Command request,
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
}
