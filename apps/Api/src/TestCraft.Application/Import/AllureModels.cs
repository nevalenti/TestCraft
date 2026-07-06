namespace TestCraft.Application.Import;

/// <summary>Failure details for an Allure test result.</summary>
public record AllureStatusDetails
{
    /// <summary>The failure message.</summary>
    public string? Message { get; init; }

    /// <summary>The failure stack trace.</summary>
    public string? Trace { get; init; }
}

/// <summary>A name/value label attached to an Allure test result.</summary>
public record AllureLabel
{
    /// <summary>The label's name (e.g. "suite", "epic").</summary>
    public required string Name { get; init; }

    /// <summary>The label's value.</summary>
    public required string Value { get; init; }
}

/// <summary>A single test result from an Allure report.</summary>
public record AllureResultItem
{
    /// <summary>The test's display name.</summary>
    public string? Name { get; init; }

    /// <summary>The test's fully qualified name.</summary>
    public string? FullName { get; init; }

    /// <summary>The Allure status string (e.g. "passed", "failed", "broken", "skipped").</summary>
    public string? Status { get; init; }

    /// <summary>Failure details, when the test did not pass.</summary>
    public AllureStatusDetails? StatusDetails { get; init; }

    /// <summary>Labels attached to the test, used to derive suite grouping.</summary>
    public IReadOnlyList<AllureLabel>? Labels { get; init; }

    /// <summary>Start time, in epoch milliseconds.</summary>
    public long? Start { get; init; }

    /// <summary>Stop time, in epoch milliseconds.</summary>
    public long? Stop { get; init; }
}
