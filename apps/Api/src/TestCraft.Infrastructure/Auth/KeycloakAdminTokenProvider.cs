using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Auth;

internal interface IKeycloakAdminTokenProvider
{
    Task<string> GetAccessTokenAsync(CancellationToken cancellationToken);

    void Invalidate();
}

internal sealed class KeycloakAdminTokenProvider(
    IHttpClientFactory httpClientFactory,
    IOptions<InfrastructureOptions> options,
    TimeProvider timeProvider
) : IKeycloakAdminTokenProvider, IDisposable
{
    private readonly SemaphoreSlim _lock = new(1, 1);
    private volatile CachedToken? _token;

    public void Dispose() => _lock.Dispose();

    public void Invalidate() => _token = null;

    public async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken)
    {
        if (_token is { } cached && timeProvider.GetUtcNow() < cached.ExpiresAt)
        {
            return cached.Value;
        }

        await _lock.WaitAsync(cancellationToken);
        try
        {
            if (_token is { } current && timeProvider.GetUtcNow() < current.ExpiresAt)
            {
                return current.Value;
            }

            var client = httpClientFactory.CreateClient("keycloak-admin");
            var response = await client.PostAsync(
                $"{options.Value.KeycloakBaseUrl}/realms/{options.Value.KeycloakRealm}/protocol/openid-connect/token",
                new FormUrlEncodedContent(
                    new Dictionary<string, string>
                    {
                        ["grant_type"] = "client_credentials",
                        ["client_id"] = options.Value.KeycloakAdminClientId,
                        ["client_secret"] = options.Value.KeycloakAdminClientSecret,
                    }
                ),
                cancellationToken
            );
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<TokenResponse>(
                cancellationToken: cancellationToken
            );

            _token = new CachedToken(
                payload!.AccessToken,
                timeProvider.GetUtcNow().AddSeconds(payload.ExpiresIn - 30)
            );
            return payload.AccessToken;
        }
        finally
        {
            _lock.Release();
        }
    }

    private sealed record CachedToken(string Value, DateTimeOffset ExpiresAt);

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn
    );
}
