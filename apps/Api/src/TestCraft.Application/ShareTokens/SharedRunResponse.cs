namespace TestCraft.Application.ShareTokens;

public record SharedRunResponse(
    string RunName,
    string Environment,
    string Status,
    DateTimeOffset CreatedAt,
    int Total,
    int Passed,
    int Failed,
    int Blocked,
    int Skipped,
    double PassRate,
    IReadOnlyList<SharedResultItem> Results
);

public record SharedResultItem(
    string TestCaseName,
    string Status,
    string? Notes,
    long? DurationMs,
    DateTimeOffset ExecutedAt
);
