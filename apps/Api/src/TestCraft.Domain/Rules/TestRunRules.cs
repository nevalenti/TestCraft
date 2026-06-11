using TestCraft.Domain.Enums;

namespace TestCraft.Domain.Rules;

public static class TestRunRules
{
    private static readonly Dictionary<TestRunStatus, int> StatusOrder = new()
    {
        [TestRunStatus.Active] = 0,
        [TestRunStatus.Completed] = 1,
        [TestRunStatus.Archived] = 2,
    };

    public static bool CanTransitionStatus(TestRunStatus from, TestRunStatus to) =>
        StatusOrder[to] >= StatusOrder[from];

    public static bool CanAddResultToRun(TestRunStatus runStatus) =>
        runStatus != TestRunStatus.Archived;
}
