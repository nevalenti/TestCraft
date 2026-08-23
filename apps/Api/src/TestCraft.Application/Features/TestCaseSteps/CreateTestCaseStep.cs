using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestCaseSteps;

/// <summary>A single step within a test case.</summary>
public record TestCaseStepResponse
{
    /// <summary>The step's identifier.</summary>
    public required TestCaseStepId Id { get; init; }

    /// <summary>The test case the step belongs to.</summary>
    public required TestCaseId TestCaseId { get; init; }

    /// <summary>The step's position within the test case.</summary>
    public required int Order { get; init; }

    /// <summary>The action to perform.</summary>
    public required string Action { get; init; }

    /// <summary>The result expected after performing the action.</summary>
    public required string ExpectedResult { get; init; }

    /// <summary>When the step was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When the step was last updated.</summary>
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestCaseStep
{
    /// <summary>Adds a new step to a test case.</summary>
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The test case to add the step to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
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
            var caseExists = await context.TestCases.AnyAsync(
                testCase =>
                    testCase.Id == request.CaseId && testCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );
            if (!caseExists)
            {
                throw new NotFoundException();
            }

            var step = new TestCaseStep
            {
                Id = TestCaseStepId.New(),
                TestCaseId = request.CaseId,
                Order = request.Order,
                Action = request.Action,
                ExpectedResult = request.ExpectedResult,
            };

            context.TestCaseSteps.Add(step);
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
