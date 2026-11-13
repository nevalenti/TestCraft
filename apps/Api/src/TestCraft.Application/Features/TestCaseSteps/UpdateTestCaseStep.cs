using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class UpdateTestCaseStep
{
    /// <summary>Updates a test case step's order, action, and expected result.</summary>
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        [JsonIgnore]
        public TestCaseId CaseId { get; init; }

        [JsonIgnore]
        public TestCaseStepId Id { get; init; }

        /// <summary>The step's new position within the test case.</summary>
        public required int Order { get; init; }

        /// <summary>The new action to perform.</summary>
        public required string Action { get; init; }

        /// <summary>The new expected result.</summary>
        public required string ExpectedResult { get; init; }

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Order).GreaterThanOrEqualTo(1);
            RuleFor(command => command.Action).NotEmpty().MaximumLength(FieldLengths.Text);
            RuleFor(command => command.ExpectedResult).NotEmpty().MaximumLength(FieldLengths.Text);
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
            var step = await context.TestCaseSteps.FirstOrNotFoundAsync(
                existingStep =>
                    existingStep.Id == request.Id
                    && existingStep.TestCaseId == request.CaseId
                    && existingStep.TestCase!.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            VersionCheck.Ensure(step, request.ExpectedVersion);
            step.Update(request.Order, request.Action, request.ExpectedResult);

            await context.SaveChangesAsync(cancellationToken);

            return TestCaseStepResponse.FromEntity(step);
        }
    }
}
