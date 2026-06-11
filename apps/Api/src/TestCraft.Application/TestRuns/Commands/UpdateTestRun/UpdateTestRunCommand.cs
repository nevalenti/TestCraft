using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Errors;
using TestCraft.Domain.Rules;

namespace TestCraft.Application.TestRuns.Commands.UpdateTestRun;

public record UpdateTestRunCommand : IRequest<TestRunResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public required TestRunStatus Status { get; init; }
}

public class UpdateTestRunCommandValidator : AbstractValidator<UpdateTestRunCommand>
{
    public UpdateTestRunCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Status).IsInEnum();
    }
}

public class UpdateTestRunCommandHandler(IApplicationDbContext context, ICacheService cache)
    : IRequestHandler<UpdateTestRunCommand, TestRunResponse>
{
    public async Task<TestRunResponse> Handle(
        UpdateTestRunCommand request,
        CancellationToken cancellationToken
    )
    {
        var run =
            await context.TestRuns.FirstOrDefaultAsync(
                r => r.Id == request.Id && r.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        if (!TestRunRules.CanTransitionStatus(run.Status, request.Status))
        {
            throw new DomainException(
                $"Cannot transition run status from {run.Status} to {request.Status}"
            );
        }

        run.Name = request.Name;
        run.Environment = request.Environment;
        run.Status = request.Status;

        await context.SaveChangesAsync(cancellationToken);

        var summary = await context
            .TestRuns.Where(r => r.Id == run.Id)
            .Select(TestRunResponse.Projection)
            .FirstAsync(cancellationToken);

        await cache.RemoveAsync(CacheKeys.TestRunResponse(run.Id), cancellationToken);

        return summary;
    }
}
