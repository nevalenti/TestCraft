using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Common;

namespace TestCraft.Application.Features.TestSections;

internal static class SectionTreeLoader
{
    public static async Task<SectionTree> LoadSectionTreeAsync(
        this IApplicationDbContext context,
        TestSuiteId suiteId,
        CancellationToken cancellationToken
    ) =>
        new(
            await context
                .TestSections.Where(section => section.SuiteId == suiteId)
                .ToListAsync(cancellationToken)
        );
}
