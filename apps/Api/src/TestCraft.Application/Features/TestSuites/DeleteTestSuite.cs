using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.Features.TestSuites;

public static class DeleteTestSuite
{
    /// <summary>Soft-deletes a test suite.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite to delete.</summary>
        public required TestSuiteId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var suite =
                await context.TestSuites.FirstOrDefaultAsync(
                    existingSuite =>
                        existingSuite.Id == request.Id
                        && existingSuite.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            suite.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
            await context.TouchPlansForSuiteAsync(
                suite.Id,
                timeProvider.GetStoredUtcNow(),
                cancellationToken
            );
        }
    }
}
