using FluentValidation;
using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Notifications.Contracts;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns;

public static class UpdateTestRun
{
    public sealed record Command : IRequest<TestRunResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
        public required string Name { get; init; }
        public required string Environment { get; init; }
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

    public sealed class Handler(
        IApplicationDbContext context,
        ICacheService cache,
        IPublishEndpoint publishEndpoint
    ) : IRequestHandler<Command, TestRunResponse>
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

            if (!run.CanTransitionTo(request.Status))
            {
                throw new DomainException(
                    $"Cannot transition run status from {run.Status} to {request.Status}"
                );
            }

            var oldStatus = run.Status;

            run.Name = request.Name;
            run.Environment = request.Environment;
            run.Status = request.Status;

            await context.SaveChangesAsync(cancellationToken);
            await cache.RemoveAsync(CacheKeys.TestRunResponse(run.Id), cancellationToken);

            if (oldStatus != request.Status)
            {
                await publishEndpoint.Publish(
                    new RunStatusChanged(
                        run.Id,
                        run.ProjectId,
                        run.Name,
                        request.Status.ToString(),
                        oldStatus.ToString()
                    ),
                    cancellationToken
                );
            }

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
