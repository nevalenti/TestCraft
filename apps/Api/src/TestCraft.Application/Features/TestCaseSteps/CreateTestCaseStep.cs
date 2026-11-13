using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class CreateTestCaseStep
{
    /// <summary>Adds a new step to a test case.</summary>
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestCaseId CaseId { get; init; }

        /// <summary>The step's position within the test case.</summary>
        public required int Order { get; init; }

        /// <summary>The action to perform.</summary>
        public required string Action { get; init; }

        /// <summary>The result expected after performing the action.</summary>
        public required string ExpectedResult { get; init; }
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
            await context.TestCases.EnsureExistsAsync(
                testCase =>
                    testCase.Id == request.CaseId && testCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            var step = TestCaseStep.Create(
                request.CaseId,
                request.Order,
                request.Action,
                request.ExpectedResult
            );

            context.TestCaseSteps.Add(step);

            await context.SaveChangesAsync(cancellationToken);

            return TestCaseStepResponse.FromEntity(step);
        }
    }
}
