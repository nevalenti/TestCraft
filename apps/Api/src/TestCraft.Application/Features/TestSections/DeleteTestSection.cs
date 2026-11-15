using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.Features.TestSections;

public static class DeleteTestSection
{
    /// <summary>Deletes a section with all its subsections and the test cases in them.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        public required TestSuiteId SuiteId { get; init; }

        public required TestSectionId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, TimeProvider timeProvider)
        : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken) =>
            await context.ExecuteInTransactionAsync(
                async token =>
                {
                    await context.TestSuites.EnsureExistsAsync(
                        suite =>
                            suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                        token
                    );
                    await context.LockSuiteAsync(request.SuiteId, token);

                    var tree = await context.LoadSectionTreeAsync(request.SuiteId, token);
                    if (tree.Find(request.Id) is null)
                    {
                        throw new NotFoundException();
                    }

                    var now = timeProvider.GetStoredUtcNow();
                    var sectionIds = tree.Subtree(request.Id);
                    foreach (var id in sectionIds)
                    {
                        tree.Find(id)!.Delete(now);
                    }

                    var cases = await context
                        .TestCases.Where(testCase =>
                            testCase.SectionId != null
                            && sectionIds.Contains(testCase.SectionId.Value)
                        )
                        .ToListAsync(token);
                    // Plan entries of deleted cases are filtered out, so touch the plans first.
                    await context.TouchPlansForCasesAsync(
                        cases.Select(testCase => testCase.Id).ToList(),
                        now,
                        token
                    );
                    foreach (var testCase in cases)
                    {
                        testCase.Delete(now);
                    }

                    await context.SaveChangesAsync(token);

                    return true;
                },
                cancellationToken
            );
    }
}
