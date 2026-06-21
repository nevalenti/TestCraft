using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestCaseSteps;

public record TestCaseStepResponse
{
    public required Guid Id { get; init; }
    public required Guid TestCaseId { get; init; }
    public required int Order { get; init; }
    public required string Action { get; init; }
    public required string ExpectedResult { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestCaseStep
{
    public sealed record Command : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid CaseId { get; init; }
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
            var step = new TestCaseStep
            {
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
