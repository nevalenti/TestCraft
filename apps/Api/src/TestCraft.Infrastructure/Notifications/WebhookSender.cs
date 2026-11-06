using System.Security.Cryptography;
using System.Text;

namespace TestCraft.Infrastructure.Notifications;

internal sealed class WebhookSender(IHttpClientFactory httpClientFactory)
{
    public const string ClientName = "notifications";
    private const string DeliveryIdHeader = "X-TestCraft-Delivery-Id";
    private const string SignatureHeader = "X-Signature";
    private const int DeliveryIdLength = 32;

    public async Task<DeliveryAttemptResult> SendAsync(
        string url,
        string? secret,
        string json,
        CancellationToken cancellationToken
    )
    {
        try
        {
            var http = httpClientFactory.CreateClient(ClientName);
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json"),
            };
            request.Headers.Add(DeliveryIdHeader, DeliveryId(url, json));

            if (!string.IsNullOrEmpty(secret))
            {
                request.Headers.Add(SignatureHeader, $"sha256={Sign(secret, json)}");
            }

            using var response = await http.SendAsync(request, cancellationToken);
            return response.IsSuccessStatusCode
                ? DeliveryAttemptResult.Ok
                : DeliveryAttemptResult.Fail($"HTTP {(int)response.StatusCode}");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            return DeliveryAttemptResult.Fail("webhook timeout", ex);
        }
        catch (HttpRequestException ex) when (ex.InnerException is InvalidOperationException)
        {
            return DeliveryAttemptResult.Fail("webhook address resolution failed", ex);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return DeliveryAttemptResult.Fail("webhook transport failed", ex);
        }
    }

    // Stable per URL and payload, so receivers can recognise a retry.
    private static string DeliveryId(string url, string json) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes($"{url}\n{json}")))[
            ..DeliveryIdLength
        ];

    private static string Sign(string secret, string payload) =>
        Convert.ToHexStringLower(
            HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes(payload))
        );
}
