namespace TestCraft.Application.Analytics;

public record TrendPoint(
    Guid RunId,
    string RunName,
    DateTimeOffset CreatedAt,
    int Total,
    int Passed,
    int Failed,
    int Blocked,
    int Skipped,
    double PassRate
);
