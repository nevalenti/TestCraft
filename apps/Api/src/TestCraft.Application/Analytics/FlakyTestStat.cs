namespace TestCraft.Application.Analytics;

public record FlakyTestStat(
    Guid TestCaseId,
    string TestCaseName,
    int TotalRuns,
    int PassCount,
    int FailCount,
    double FlakRate
);
