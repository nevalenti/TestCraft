using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

namespace TestCraft.VSTestLogger;

internal static class TestEventFormatter
{
    public static string FormatMessage(TestRunMessageEventArgs eventArgs)
    {
        var prefix = eventArgs.Level switch
        {
            TestMessageLevel.Error => "[error]",
            TestMessageLevel.Warning => "[warn]",
            _ => "[info]",
        };
        return $"{prefix} {eventArgs.Message}";
    }

    public static IEnumerable<string> FormatResult(TestResultEventArgs eventArgs)
    {
        var result = eventArgs.Result;
        var icon = result.Outcome switch
        {
            TestOutcome.Passed => "✓",
            TestOutcome.Skipped or TestOutcome.NotFound => "-",
            _ => "✗",
        };
        var duration = result.Duration;
        var durationText =
            duration.TotalSeconds >= 1
                ? $"{duration.TotalSeconds:0.0}s"
                : $"{duration.TotalMilliseconds:0}ms";
        var testName = string.IsNullOrWhiteSpace(result.DisplayName)
            ? result.TestCase.DisplayName
            : result.DisplayName;
        if (string.IsNullOrWhiteSpace(testName))
            testName = result.TestCase.FullyQualifiedName;

        yield return $"{icon}  {testName} ({durationText})";

        if (
            result.Outcome == TestOutcome.Failed
            && !string.IsNullOrWhiteSpace(result.ErrorMessage)
        )
            yield return $"    {result.ErrorMessage}";

        foreach (
            var message in result.Messages.Where(candidate =>
                !string.IsNullOrWhiteSpace(candidate.Text)
            )
        )
            yield return message.Text!.TrimEnd();
    }
}
