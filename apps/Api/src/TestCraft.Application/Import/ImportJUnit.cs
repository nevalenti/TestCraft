using FluentValidation;
using MassTransit;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Import.Contracts;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public static class ImportJUnit
{
    /// <summary>Queues a JUnit XML report for import.</summary>
    public sealed record Command : IRequest<ImportJobResponse>, IProjectScopedRequest
    {
        /// <summary>The project to import the run into.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>The raw JUnit XML report content.</summary>
        public required string Xml { get; init; }

        /// <summary>The environment label to record on the run.</summary>
        public required string Environment { get; init; }

        /// <summary>The name to give the created run, if a new run is being created.</summary>
        public string? Name { get; init; }

        /// <summary>Identifies the CI system or tool the report came from.</summary>
        public string? Source { get; init; }

        /// <summary>An existing active run to import results into, instead of creating one.</summary>
        public Guid? RunId { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Xml)
                .NotEmpty()
                .WithMessage("XML content is required")
                .MaximumLength(4_500_000);
            RuleFor(command => command.Environment)
                .NotEmpty()
                .WithMessage("Environment is required")
                .MaximumLength(255);
            RuleFor(command => command.Name)
                .NotEmpty()
                .MaximumLength(255)
                .When(command => command.Name is not null);
            RuleFor(command => command.Source)
                .NotEmpty()
                .MaximumLength(100)
                .When(command => command.Source is not null);
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

            var message = new ImportJUnitRequested
            {
                JobId = job.Id,
                ProjectId = request.ProjectId,
                Xml = request.Xml,
                Environment = request.Environment,
                Name = request.Name,
                Source = request.Source,
                RunId = request.RunId,
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
