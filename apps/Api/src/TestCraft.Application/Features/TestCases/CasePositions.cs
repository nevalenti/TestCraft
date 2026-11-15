using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.TestCases;

internal static class CasePositions
{
    public static async Task<int> NextCasePositionAsync(
        this IApplicationDbContext context,
        TestSuiteId suiteId,
        TestSectionId? sectionId,
        CancellationToken cancellationToken
    ) =>
        (
            await context
                .TestCases.Where(testCase =>
                    testCase.SuiteId == suiteId && testCase.SectionId == sectionId
                )
                .MaxAsync(testCase => (int?)testCase.Position, cancellationToken)
            ?? 0
        ) + 1;
}
