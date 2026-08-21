using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Auth;

internal sealed class KeycloakUserDirectory(
    IHttpClientFactory httpClientFactory,
    IKeycloakAdminTokenProvider tokenProvider,
    InfrastructureOptions options
) : IKeycloakUserDirectory
{
    public async Task<KeycloakUser?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    )
    {
        var token = await tokenProvider.GetAccessTokenAsync(cancellationToken);

        var client = httpClientFactory.CreateClient("keycloak-admin");
        var request = new HttpRequestMessage(
            HttpMethod.Get,
            $"{options.KeycloakBaseUrl}/admin/realms/{options.KeycloakRealm}/users"
                + $"?email={Uri.EscapeDataString(email)}&exact=true"
        );
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var users = await response.Content.ReadFromJsonAsync<List<KeycloakUserDto>>(
            cancellationToken: cancellationToken
        );
        var match = users?.FirstOrDefault();
        if (match is null)
            return null;

        var fullName = $"{match.FirstName} {match.LastName}".Trim();
        var displayName = string.IsNullOrWhiteSpace(fullName) ? match.Username : fullName;

        return new KeycloakUser(
            UserId.Parse(match.Id, CultureInfo.InvariantCulture),
            match.Email,
            displayName
        );
    }

    private sealed record KeycloakUserDto(
        string Id,
        string Email,
        string? Username,
        string? FirstName,
        string? LastName
    );
}
