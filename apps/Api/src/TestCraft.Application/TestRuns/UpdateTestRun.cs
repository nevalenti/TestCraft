using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns;

public static class UpdateTestRun
{
    /// <summary>Updates a test run's name, environment, and status.</summary>
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The run to update.</summary>
        public Guid Id { get; init; }

        /// <summary>The run's new display name.</summary>
        public required string Name { get; init; }

        /// <summary>The run's new environment.</summary>
        public required string Environment { get; init; }

        /// <summary>The run's new status.</summary>
        public required TestRunStatus Status { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Status).IsInEnum();
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
            var run =
                await context.TestRuns.FirstOrDefaultAsync(
                    r => r.Id == request.Id && r.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.Name = request.Name;
            run.Environment = request.Environment;
            run.TransitionTo(request.Status);

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestRuns.Where(r => r.Id == run.Id)
                .Select(r => new TestRunResponse
                {
                    Id = r.Id,
                    ProjectId = r.ProjectId,
                    Name = r.Name,
                    Environment = r.Environment,
                    Status = r.Status,
                    Source = r.Source,
                    ExecutedById = r.ExecutedById,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
