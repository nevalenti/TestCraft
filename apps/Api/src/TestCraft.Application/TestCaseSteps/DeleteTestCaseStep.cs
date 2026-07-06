using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class DeleteTestCaseStep
{
    /// <summary>Soft-deletes a test case step.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        public required Guid CaseId { get; init; }

        /// <summary>The step to delete.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var step =
                await context.TestCaseSteps.FirstOrDefaultAsync(
                    s => s.Id == request.Id && s.TestCaseId == request.CaseId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            step.IsDeleted = true;
            step.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
