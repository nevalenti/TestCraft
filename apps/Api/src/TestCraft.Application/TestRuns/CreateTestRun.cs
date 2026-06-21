using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns;

public record TestRunResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public required TestRunStatus Status { get; init; }
    public string? Source { get; init; }
    public Guid? ExecutedById { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestRun
{
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public required string Environment { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestRunResponse>
    {
        public async Task<TestRunResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var run = new TestRun
            {
                ProjectId = request.ProjectId,
                Name = request.Name,
                Environment = request.Environment,
                Status = TestRunStatus.Active,
            };

            context.TestRuns.Add(run);
            await context.SaveChangesAsync(cancellationToken);

            return new TestRunResponse
            {
                Id = run.Id,
                ProjectId = run.ProjectId,
                Name = run.Name,
                Environment = run.Environment,
                Status = run.Status,
                Source = run.Source,
                ExecutedById = run.ExecutedById,
                CreatedAt = run.CreatedAt,
                UpdatedAt = run.UpdatedAt,
            };
        }
    }
}
