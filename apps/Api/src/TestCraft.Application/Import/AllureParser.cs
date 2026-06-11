using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import;

public static class AllureParser
{
    public static List<ParsedTestCase> Parse(IReadOnlyList<AllureResultItem> results)
    {
        var cases = new List<ParsedTestCase>(results.Count);

        for (var i = 0; i < results.Count; i++)
        {
            var result = results[i];
            cases.Add(
                new ParsedTestCase
                {
                    SuiteName =
                        LabelValue(result.Labels, "suite", "parentSuite", "testClass")
                        ?? "Default Suite",
                    CaseName = result.Name ?? result.FullName ?? $"Unknown ({i + 1})",
                    Status = ResolveStatus(result.Status),
                    Notes = result.StatusDetails?.Message,
                }
            );
        }

        return cases;
    }

    private static TestResultStatus ResolveStatus(string? status) =>
        status switch
        {
            "passed" => TestResultStatus.Passed,
            "failed" or "broken" => TestResultStatus.Failed,
            "skipped" => TestResultStatus.Skipped,
            _ => TestResultStatus.Blocked,
        };

    private static string? LabelValue(IReadOnlyList<AllureLabel>? labels, params string[] keys)
    {
        if (labels is null)
        {
            return null;
        }

        var map = new Dictionary<string, string>();
        foreach (var label in labels)
        {
            map[label.Name] = label.Value;
        }

        foreach (var key in keys)
        {
            if (map.TryGetValue(key, out var value) && !string.IsNullOrEmpty(value))
            {
                return value;
            }
        }

        return null;
    }
}
