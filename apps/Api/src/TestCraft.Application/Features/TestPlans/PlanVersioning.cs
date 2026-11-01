using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Features.TestPlans;

internal static class PlanVersioning
{
    public static Task TouchPlanAsync(
        this IApplicationDbContext context,
        TestPlanId planId,
        DateTimeOffset now,
        CancellationToken cancellationToken
    ) => TouchAsync(context.TestPlans.Where(plan => plan.Id == planId), now, cancellationToken);

    public static Task TouchPlansForCaseAsync(
        this IApplicationDbContext context,
        TestCaseId caseId,
        DateTimeOffset now,
        CancellationToken cancellationToken
    ) =>
        TouchAsync(
            context.TestPlans.Where(plan =>
                plan.TestPlanCases.Any(entry => entry.TestCaseId == caseId)
            ),
            now,
            cancellationToken
        );

    public static Task TouchPlansForSuiteAsync(
        this IApplicationDbContext context,
        TestSuiteId suiteId,
        DateTimeOffset now,
        CancellationToken cancellationToken
    ) =>
        TouchAsync(
            context.TestPlans.Where(plan =>
                plan.TestPlanCases.Any(entry =>
                    context.TestCases.Any(testCase =>
                        testCase.Id == entry.TestCaseId && testCase.SuiteId == suiteId
                    )
                )
            ),
            now,
            cancellationToken
        );

    private static async Task TouchAsync(
        IQueryable<Domain.Entities.TestPlan> plans,
        DateTimeOffset now,
        CancellationToken cancellationToken
    )
    {
        await plans.ExecuteUpdateAsync(
            setters =>
                setters
                    .SetProperty(plan => plan.Version, plan => plan.Version + 1)
                    .SetProperty(plan => plan.UpdatedAt, now),
            cancellationToken
        );
    }
}
