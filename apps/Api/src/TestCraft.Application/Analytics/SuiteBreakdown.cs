namespace TestCraft.Application.Analytics;

public record SuiteBreakdown(string SuiteName, int Passed, int Failed, int Blocked, int Skipped);
