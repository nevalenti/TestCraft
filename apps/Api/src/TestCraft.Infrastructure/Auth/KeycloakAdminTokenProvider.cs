using System.Net.Http.Json;
using System.Text.Json.Serialization;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Auth;

internal interface IKeycloakAdminTokenProvider
{
    Task<string> GetAccessTokenAsync(CancellationToken cancellationToken);
}

internal sealed class KeycloakAdminTokenProvider(
    IHttpClientFactory httpClientFactory,
    InfrastructureOptions options
) : IKeycloakAdminTokenProvider, IDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private string? _token;
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public void Dispose() => _lock.Dispose();

    public async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (_token is not null && DateTimeOffset.UtcNow < _expiresAt)
            return _token;

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_token is not null && DateTimeOffset.UtcNow < _expiresAt)
                return _token;

            var client = httpClientFactory.CreateClient("keycloak-admin");
            var response = await client.PostAsync(
                $"{options.KeycloakBaseUrl}/realms/master/protocol/openid-connect/token",
                new FormUrlEncodedContent(
                    new Dictionary<string, string>
                    {
                        ["grant_type"] = "password",
                        ["client_id"] = "admin-cli",
                        ["username"] = options.KeycloakAdminUsername,
                        ["password"] = options.KeycloakAdminPassword,
                    }
                ),
                cancellationToken
            );
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<TokenResponse>(
                cancellationToken: cancellationToken
            );

            _token = payload!.AccessToken;
            _expiresAt = DateTimeOffset.UtcNow.AddSeconds(payload.ExpiresIn - 30);
            return _token;
        }
        finally
        {
            _lock.Release();
        }
    }

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn
    );
}
