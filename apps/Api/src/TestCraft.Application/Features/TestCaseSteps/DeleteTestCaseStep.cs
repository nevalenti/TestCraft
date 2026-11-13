using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class DeleteTestCaseStep
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        public required TestCaseId CaseId { get; init; }

        public required TestCaseStepId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var step = await context.TestCaseSteps.FirstOrNotFoundAsync(
                existingStep =>
                    existingStep.Id == request.Id
                    && existingStep.TestCaseId == request.CaseId
                    && existingStep.TestCase!.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            step.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
