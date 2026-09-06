using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Client;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

namespace TestCraft.VSTestLogger;

[FriendlyName("testcraft")]
[ExtensionUri("logger://TestCraft/VSTestLogger/v1")]
public sealed class TestCraftLogger : ITestLoggerWithParameters
{
    private const int BatchSize = 50;

    private static readonly HttpClient Client = TestCraftApiClient.CreateHttpClient();

    private readonly LogLineBuffer _buffer = new(BatchSize);
    private TestCraftApiClient? _apiClient;

    public void Initialize(TestLoggerEvents events, string testRunDirectory) =>
        Initialize(events, new Dictionary<string, string?>());

    public void Initialize(
        TestLoggerEvents events,
        Dictionary<string, string?> parameters
    )
    {
        var options = TestCraftLoggerOptions.Resolve(Client);
        if (options is null)
            return;

        _apiClient = new TestCraftApiClient(Client, options);

        events.TestRunMessage += OnTestRunMessage;
        events.TestResult += OnTestResult;
        events.TestRunComplete += OnTestRunComplete;
    }

    private void OnTestRunMessage(
        object? sender,
        TestRunMessageEventArgs eventArgs
    ) => PostLog(TestEventFormatter.FormatMessage(eventArgs));

    private void OnTestResult(object? sender, TestResultEventArgs eventArgs)
    {
        foreach (var line in TestEventFormatter.FormatResult(eventArgs))
            PostLog(line);
    }

    private void OnTestRunComplete(
        object? sender,
        TestRunCompleteEventArgs eventArgs
    )
    {
        PostBatch(_buffer.Flush());
        _apiClient?.WaitForPendingSends();
    }

    private void PostLog(string line) => PostBatch(_buffer.Add(line));

    private void PostBatch(IReadOnlyList<string>? batch)
    {
        if (batch is not null)
            _apiClient?.EnqueueLogs(batch);
    }
}
