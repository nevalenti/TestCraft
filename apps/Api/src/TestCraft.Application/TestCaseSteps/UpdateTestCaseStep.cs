using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class UpdateTestCaseStep
{
    /// <summary>Updates a test case step's order, action, and expected result.</summary>
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        public Guid CaseId { get; init; }

        /// <summary>The step to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The step's new position within the test case.</summary>
        public required int Order { get; init; }

        /// <summary>The new action to perform.</summary>
        public required string Action { get; init; }

        /// <summary>The new expected result.</summary>
        public required string ExpectedResult { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Order).GreaterThanOrEqualTo(1);
            RuleFor(command => command.Action).NotEmpty().MaximumLength(2000);
            RuleFor(command => command.ExpectedResult).NotEmpty().MaximumLength(2000);
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
                    existingStep =>
                        existingStep.Id == request.Id && existingStep.TestCaseId == request.CaseId,
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
