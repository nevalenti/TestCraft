using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Common.Extensions;

public static class ResultQueries
{
    public static IQueryable<TestResult> LiveResults(this IApplicationDbContext context) =>
        context
            .TestResults.IgnoreQueryFilters()
            .Where(result => !result.IsDeleted && !result.TestRun!.IsDeleted);
}
