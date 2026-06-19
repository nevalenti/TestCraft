namespace TestCraft.Application.Analytics;

public record RunComparison(string RunAName, string RunBName, IReadOnlyList<ComparisonRow> Results);

public record ComparisonRow(
    Guid TestCaseId,
    string TestCaseName,
    string? StatusInA,
    string? StatusInB,
    bool IsRegression,
    bool IsFix
);
