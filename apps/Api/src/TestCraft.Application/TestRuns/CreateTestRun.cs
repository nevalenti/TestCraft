using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestRuns;

public static class CreateTestRun
{
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required string Name { get; init; }
        public required string Environment { get; init; }
        public string? Source { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Source).NotEmpty().MaximumLength(100).When(x => x.Source is not null);
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
                Source = request.Source?.ToLowerInvariant(),
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
