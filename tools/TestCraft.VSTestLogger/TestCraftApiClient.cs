using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace TestCraft.VSTestLogger;

internal sealed class TestCraftApiClient(HttpClient http, TestCraftLoggerOptions options)
{
    private const int MaxSendAttempts = 3;
    private static readonly TimeSpan RetryDelay = TimeSpan.FromSeconds(1);

    private readonly ConcurrentBag<Task> _pendingSends = [];

    public static HttpClient CreateHttpClient()
    {
        if (
            Environment.GetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED")
            != "0"
        )
            return new HttpClient();

        var handler = new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback = (_, _, _, _) => true,
        };
        return new HttpClient(handler);
    }

    public static string FetchAuthority(HttpClient http, string apiUrl)
    {
        var response = http.GetAsync($"{apiUrl}/api/auth-config")
            .GetAwaiter()
            .GetResult();
        response.EnsureSuccessStatusCode();

        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var document = JsonDocument.Parse(body);

        return document.RootElement.GetProperty("authority").GetString()!;
    }

    public static string FetchToken(
        HttpClient http,
        string authority,
        string username,
        string password
    )
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

        var response = http.PostAsync(
                $"{authority}/protocol/openid-connect/token",
                form
            )
            .GetAwaiter()
            .GetResult();
        response.EnsureSuccessStatusCode();

        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var document = JsonDocument.Parse(body);

        return document.RootElement.GetProperty("access_token").GetString()!;
    }

    public static string FindProjectId(
        HttpClient http,
        string apiUrl,
        string token,
        string projectName
    )
    {
        var url =
            $"{apiUrl}/api/v1/projects?search={Uri.EscapeDataString(projectName)}&pageSize=500";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            token
        );

        var response = http.SendAsync(request).GetAwaiter().GetResult();
        response.EnsureSuccessStatusCode();

        var body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        using var document = JsonDocument.Parse(body);

        var match = document
            .RootElement.GetProperty("items")
            .EnumerateArray()
            .FirstOrDefault(item =>
                item.GetProperty("name").GetString() == projectName
            );

        if (match.ValueKind == JsonValueKind.Undefined)
            throw new InvalidOperationException(
                $"Project \"{projectName}\" not found"
            );

        return match.GetProperty("id").GetString()!;
    }

    public void EnqueueLogs(IReadOnlyList<string> lines) =>
        _pendingSends.Add(SendLogsAsync(lines));

    public void WaitForPendingSends() => Task.WaitAll([.. _pendingSends]);

    private async Task SendLogsAsync(IReadOnlyList<string> lines)
    {
        var url =
            $"{options.ApiUrl}/api/v1/projects/{options.ProjectId}/runs/{options.RunId}/logs";
        var payload = JsonSerializer.Serialize(new { lines });

        for (var attempt = 1; attempt <= MaxSendAttempts; attempt++)
        {
            HttpResponseMessage response;
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(
                        payload,
                        Encoding.UTF8,
                        "application/json"
                    ),
                };
                request.Headers.Authorization = new AuthenticationHeaderValue(
                    "Bearer",
                    options.Token
                );

                response = await http.SendAsync(request).ConfigureAwait(false);
            }
            catch (Exception) when (attempt < MaxSendAttempts)
            {
                await Task.Delay(RetryDelay * attempt).ConfigureAwait(false);
                continue;
            }
            catch (Exception ex)
            {
                await LogFailureAsync(lines.Count, ex.Message).ConfigureAwait(false);
                return;
            }

            using (response)
            {
                if (response.IsSuccessStatusCode)
                    return;

                var body = await response
                    .Content.ReadAsStringAsync()
                    .ConfigureAwait(false);
                await LogFailureAsync(
                        lines.Count,
                        $"{(int)response.StatusCode} {body}"
                    )
                    .ConfigureAwait(false);
                return;
            }
        }
    }

    private static Task LogFailureAsync(int lineCount, string detail) =>
        Console.Error.WriteLineAsync(
            $"[TestCraft] Failed to send {lineCount} log line(s): {detail}"
        );
}
