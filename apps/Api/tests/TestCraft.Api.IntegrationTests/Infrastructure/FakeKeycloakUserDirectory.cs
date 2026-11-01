using System.Collections.Concurrent;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Api.IntegrationTests.Infrastructure;

public class FakeKeycloakUserDirectory : IKeycloakUserDirectory
{
    private readonly ConcurrentDictionary<string, KeycloakUser> _users = new(
        StringComparer.OrdinalIgnoreCase
    );

    public void Register(
        string email,
        Guid userId,
        string? displayName = null,
        bool emailVerified = true
    ) => _users[email] = new KeycloakUser(UserId.From(userId), email, displayName, emailVerified);

    public Task<KeycloakUser?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    ) => Task.FromResult(_users.GetValueOrDefault(email));
}
