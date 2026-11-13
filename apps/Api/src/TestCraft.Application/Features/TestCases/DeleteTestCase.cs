using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.Features.TestCases;

public static class DeleteTestCase
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public required TestSuiteId SuiteId { get; init; }

        public required TestCaseId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var testCase = await context.TestCases.FirstOrNotFoundAsync(
                existingTestCase =>
                    existingTestCase.Id == request.Id
                    && existingTestCase.SuiteId == request.SuiteId
                    && existingTestCase.Suite!.ProjectId == request.ProjectId,
                cancellationToken
            );

            testCase.Delete(timeProvider.GetStoredUtcNow());

            await context.SaveChangesAsync(cancellationToken);
            await context.TouchPlansForCaseAsync(
                testCase.Id,
                timeProvider.GetStoredUtcNow(),
                cancellationToken
            );
        }
    }
}
