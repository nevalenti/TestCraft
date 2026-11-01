using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Concurrency;
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

        [JsonIgnore]
        public int? ExpectedVersion { get; init; }

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

    public sealed class Handler(IApplicationDbContext context, ITestRunNotifier notifier)
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

            VersionCheck.Ensure(run, request.ExpectedVersion);

            var statusChanged = run.Status != request.Status;
            run.Update(request.Name, request.Environment);
            run.TransitionTo(request.Status);

            await context.SaveChangesAsync(cancellationToken);
            if (!statusChanged)
            {
                await notifier.DashboardChangedAsync(run.ProjectId, run.Id, cancellationToken);
            }

            return TestRunResponse.FromEntity(run);
        }
    }
}
