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
    public sealed record Command : IRequest<ImportJobResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required string Xml { get; init; }
        public required string Environment { get; init; }
        public string? Name { get; init; }
        public string? Source { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Xml)
                .NotEmpty()
                .WithMessage("XML content is required")
                .MaximumLength(4_500_000);
            RuleFor(x => x.Environment)
                .NotEmpty()
                .WithMessage("Environment is required")
                .MaximumLength(255);
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255).When(x => x.Name is not null);
            RuleFor(x => x.Source).NotEmpty().MaximumLength(100).When(x => x.Source is not null);
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
                new ImportJUnitRequested
                {
                    JobId = job.Id,
                    ProjectId = request.ProjectId,
                    Xml = request.Xml,
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
