using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.VisualStudio.TestPlatform.ObjectModel;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Client;
using Microsoft.VisualStudio.TestPlatform.ObjectModel.Logging;

namespace TestCraft.VSTestLogger;

/// <summary>
/// Streams live per-test progress from `dotnet test` to TestCraft's run log
/// feed. Registered via `--logger:testcraft`; a no-op unless the
/// TESTCRAFT_* environment variables are set, so it's safe to enable
/// unconditionally in CI.
/// </summary>
[FriendlyName("testcraft")]
[ExtensionUri("logger://TestCraft/VSTestLogger/v1")]
public sealed class TestCraftLogger : ITestLoggerWithParameters
{
    private static readonly HttpClient Client = CreateHttpClient();

    private static HttpClient CreateHttpClient()
    {
        if (Environment.GetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED") != "0")
            return new HttpClient();

        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
        };
        return new HttpClient(handler);
    }

    private readonly ConcurrentBag<Task> _pending = [];
    private string? _apiUrl;
    private string? _projectId;
    private string? _token;
    private string? _runId;

    public void Initialize(TestLoggerEvents events, string testRunDirectory) =>
        Initialize(events, new Dictionary<string, string?>());

    public void Initialize(TestLoggerEvents events, Dictionary<string, string?> parameters)
    {
        var apiUrl = Environment.GetEnvironmentVariable("TESTCRAFT_API_URL");
        var runId = Environment.GetEnvironmentVariable("TESTCRAFT_RUN_ID");
        var username = Environment.GetEnvironmentVariable("TESTCRAFT_USERNAME");
        var password = Environment.GetEnvironmentVariable("TESTCRAFT_PASSWORD");
        var projectName = Environment.GetEnvironmentVariable("TESTCRAFT_PROJECT_NAME");

        if (
            string.IsNullOrEmpty(apiUrl)
            || string.IsNullOrEmpty(runId)
            || string.IsNullOrEmpty(username)
            || string.IsNullOrEmpty(password)
            || string.IsNullOrEmpty(projectName)
        )
            return;

        var keycloakAuthority = Environment.GetEnvironmentVariable("TESTCRAFT_KEYCLOAK_AUTHORITY");

        try
        {
            var authority = keycloakAuthority ?? FetchAuthority(apiUrl);
            _token = FetchToken(authority, username, password);
            _projectId = FindProjectId(apiUrl, projectName);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[TestCraft] Logger init failed: {ex.Message}");
            return;
        }

        _apiUrl = apiUrl;
        _runId = runId;

        events.TestRunMessage += OnTestRunMessage;
        events.TestResult += OnTestResult;
        events.TestRunComplete += OnTestRunComplete;
    }

    private static string FetchAuthority(string apiUrl)
    {
        var response = Client.GetAsync($"{apiUrl}/api/auth-config").GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();
        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("authority").GetString()!;
    }

    private static string FetchToken(string authority, string username, string password)
    {
        using var form = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["grant_type"] = "password",
                ["client_id"] = "testcraft-web",
                ["username"] = username,
                ["password"] = password,
            }
        );
        var response = Client
            .PostAsync($"{authority}/protocol/openid-connect/token", form)
            .GetAwaiter()
            .GetResult();
        response.EnsureSuccessStatusCode();
        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement.GetProperty("access_token").GetString()!;
    }

    private string FindProjectId(string apiUrl, string projectName)
    {
        var url =
            $"{apiUrl}/api/v1/projects?search={Uri.EscapeDataString(projectName)}&pageSize=500";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        var response = Client.SendAsync(request).GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();
        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var doc = JsonDocument.Parse(body);

        var match = doc
            .RootElement.GetProperty("items")
            .EnumerateArray()
            .FirstOrDefault(item => item.GetProperty("name").GetString() == projectName);

        if (match.ValueKind == JsonValueKind.Undefined)
            throw new InvalidOperationException($"Project \"{projectName}\" not found");

        return match.GetProperty("id").GetString()!;
    }

    private void OnTestRunMessage(object? sender, TestRunMessageEventArgs e)
    {
        var prefix = e.Level switch
        {
            TestMessageLevel.Error => "[error]",
            TestMessageLevel.Warning => "[warn]",
            _ => "[info]",
        };
        PostLog($"{prefix} {e.Message}");
    }

    private void OnTestResult(object? sender, TestResultEventArgs e)
    {
        var icon = e.Result.Outcome switch
        {
            TestOutcome.Passed => "✓",
            TestOutcome.Skipped or TestOutcome.NotFound => "-",
            _ => "✗",
        };
        var duration = e.Result.Duration;
        var durationText =
            duration.TotalSeconds >= 1
                ? $"{duration.TotalSeconds:0.0}s"
                : $"{duration.TotalMilliseconds:0}ms";
        PostLog($"{icon}  {e.Result.TestCase.FullyQualifiedName} ({durationText})");

        if (
            e.Result.Outcome == TestOutcome.Failed
            && !string.IsNullOrWhiteSpace(e.Result.ErrorMessage)
        )
            PostLog($"    {e.Result.ErrorMessage}");

        foreach (var message in e.Result.Messages.Where(m => !string.IsNullOrWhiteSpace(m.Text)))
            PostLog(message.Text!.TrimEnd());
    }

    private void OnTestRunComplete(object? sender, TestRunCompleteEventArgs e) =>
        Task.WaitAll([.. _pending]);

    private void PostLog(string line)
    {
        if (_apiUrl is null || _projectId is null || _runId is null)
            return;

        _pending.Add(SendLogAsync(line));
    }

    private async Task SendLogAsync(string line)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new { lines = new[] { line } });
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"{_apiUrl}/api/v1/projects/{_projectId}/runs/{_runId}/logs"
            )
            {
                Content = new StringContent(payload, Encoding.UTF8, "application/json"),
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            await Client.SendAsync(request).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            // non-critical — swallow, mirrors the Node reporters
            await Console.Error.WriteLineAsync(
                $"[TestCraft] Failed to send log line: {ex.Message}"
            );
        }
    }
}
