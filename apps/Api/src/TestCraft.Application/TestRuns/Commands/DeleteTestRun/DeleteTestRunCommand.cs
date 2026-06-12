using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.TestRuns.Commands.DeleteTestRun;

public record DeleteTestRunCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestRunCommandHandler(IApplicationDbContext context, ICacheService cache)
    : IRequestHandler<DeleteTestRunCommand>
{
    public async Task Handle(DeleteTestRunCommand request, CancellationToken cancellationToken)
    {
        var run =
            await context.TestRuns.FirstOrDefaultAsync(
                r => r.Id == request.Id && r.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        run.IsDeleted = true;
        run.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheKeys.TestRunResponse(run.Id), cancellationToken);
    }
}
