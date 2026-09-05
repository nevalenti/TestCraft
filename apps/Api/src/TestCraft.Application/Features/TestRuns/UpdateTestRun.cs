using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.TestRuns;

public static class UpdateTestRun
{
    /// <summary>Updates a test run's name, environment, and status.</summary>
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        /// <summary>The project the run belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The run to update.</summary>
        [JsonIgnore]
        public TestRunId Id { get; init; }

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
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Environment).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Status).IsInEnum();
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
                    existingRun =>
                        existingRun.Id == request.Id && existingRun.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            run.Name = request.Name;
            run.Environment = request.Environment;
            run.TransitionTo(request.Status);

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestRuns.Where(updatedRun => updatedRun.Id == run.Id)
                .Select(updatedRun => new TestRunResponse
                {
                    Id = updatedRun.Id,
                    ProjectId = updatedRun.ProjectId,
                    Name = updatedRun.Name,
                    Environment = updatedRun.Environment,
                    Status = updatedRun.Status,
                    Source = updatedRun.Source,
                    ExecutedById = updatedRun.ExecutedById,
                    CreatedAt = updatedRun.CreatedAt,
                    UpdatedAt = updatedRun.UpdatedAt,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
