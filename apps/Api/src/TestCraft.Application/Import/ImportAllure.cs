using FluentValidation;
using MassTransit;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Import.Contracts;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public record ImportJobResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required ImportJobStatus Status { get; init; }
    public Guid? TestRunId { get; init; }
    public string? Error { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class ImportAllure
{
    public sealed record Command : IRequest<ImportJobResponse>, IProjectScopedRequest
    {
        public const string DefaultRunName = "Allure Import";

        public Guid ProjectId { get; init; }
        public required IReadOnlyList<AllureResultItem> Results { get; init; }
        public required string Environment { get; init; }
        public string? Name { get; init; }
        public string? Source { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        private static readonly string[] ValidStatuses =
        [
            "passed",
            "failed",
            "broken",
            "skipped",
            "unknown",
        ];

        public Validator()
        {
            RuleFor(x => x.Results)
                .NotEmpty()
                .WithMessage("At least one result is required")
                .Must(results => results.Count <= 10_000)
                .WithMessage("Too many results — split into smaller batches");

            RuleFor(x => x.Environment)
                .NotEmpty()
                .WithMessage("Environment is required")
                .MaximumLength(255);
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255).When(x => x.Name is not null);
            RuleFor(x => x.Source).NotEmpty().MaximumLength(100).When(x => x.Source is not null);

            RuleForEach(x => x.Results)
                .ChildRules(result =>
                {
                    result
                        .RuleFor(r => r.Status)
                        .Must(status => ValidStatuses.Contains(status))
                        .When(r => r.Status is not null);

                    result
                        .RuleFor(r => r.StatusDetails!.Message)
                        .MaximumLength(5000)
                        .When(r => r.StatusDetails?.Message is not null);

                    result
                        .RuleFor(r => r.StatusDetails!.Trace)
                        .MaximumLength(5000)
                        .When(r => r.StatusDetails?.Trace is not null);
                });
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IPublishEndpoint publishEndpoint
    ) : IRequestHandler<Command, ImportJobResponse>
    {
        public async Task<ImportJobResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var job = new ImportJob
            {
                ProjectId = request.ProjectId,
                Status = ImportJobStatus.Pending,
                CreatedById = currentUser.UserId,
            };

            context.ImportJobs.Add(job);
            await context.SaveChangesAsync(cancellationToken);

            await publishEndpoint.Publish(
                new ImportAllureRequested
                {
                    JobId = job.Id,
                    ProjectId = request.ProjectId,
                    Results = request.Results,
                    Environment = request.Environment,
                    Name = request.Name,
                    Source = request.Source,
                    UserId = currentUser.UserId,
                },
                cancellationToken
            );

            return new ImportJobResponse
            {
                Id = job.Id,
                ProjectId = job.ProjectId,
                Status = job.Status,
                TestRunId = job.TestRunId,
                Error = job.Error,
                CreatedAt = job.CreatedAt,
                UpdatedAt = job.UpdatedAt,
            };
        }
    }
}
