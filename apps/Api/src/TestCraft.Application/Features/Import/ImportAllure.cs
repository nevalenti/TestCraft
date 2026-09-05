using FluentValidation;

using MassTransit;

using MediatR;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Application.Features.Import.Contracts;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Import;

public static class ImportAllure
{
    /// <summary>Queues an Allure report for import as a new test run.</summary>
    public sealed record Command : IRequest<ImportJobResponse>, IProjectScopedRequest
    {
        public const string DefaultRunName = "Allure Import";

        /// <summary>The project to import the run into.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The Allure test results to import.</summary>
        public required IReadOnlyList<AllureResultItem> Results { get; init; }

        /// <summary>The environment label to record on the created run.</summary>
        public required string Environment { get; init; }

        /// <summary>The name to give the created run. Defaults to "Allure Import" if omitted.</summary>
        public string? Name { get; init; }

        /// <summary>Identifies the CI system or tool the report came from.</summary>
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
            RuleFor(command => command.Results)
                .NotEmpty()
                .WithMessage("At least one result is required")
                .Must(results => results.Count <= 10_000)
                .WithMessage("Too many results — split into smaller batches");

            RuleFor(command => command.Environment)
                .NotEmpty()
                .WithMessage("Environment is required")
                .MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Name)
                .NotEmpty()
                .MaximumLength(FieldLengths.Name)
                .When(command => command.Name is not null);
            RuleFor(command => command.Source)
                .NotEmpty()
                .MaximumLength(100)
                .When(command => command.Source is not null);

            RuleForEach(command => command.Results)
                .ChildRules(result =>
                {
                    result
                        .RuleFor(item => item.Status)
                        .Must(status => ValidStatuses.Contains(status))
                        .When(item => item.Status is not null);

                    result
                        .RuleFor(item => item.StatusDetails!.Message)
                        .MaximumLength(5000)
                        .When(item => item.StatusDetails?.Message is not null);

                    result
                        .RuleFor(item => item.StatusDetails!.Trace)
                        .MaximumLength(5000)
                        .When(item => item.StatusDetails?.Trace is not null);
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
                Id = ImportJobId.New(),
                ProjectId = request.ProjectId,
                Status = ImportJobStatus.Pending,
                CreatedById = currentUser.UserId,
            };

            context.ImportJobs.Add(job);

            await context.SaveChangesAsync(cancellationToken);

            var message = new ImportAllureRequested
            {
                JobId = job.Id,
                ProjectId = request.ProjectId,
                Results = request.Results,
                Environment = request.Environment,
                Name = request.Name,
                Source = request.Source,
                UserId = currentUser.UserId,
                UserName = currentUser.UserName,
            };

            await publishEndpoint.Publish(message, cancellationToken);

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
