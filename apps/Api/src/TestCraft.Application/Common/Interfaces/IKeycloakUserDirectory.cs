namespace TestCraft.Application.Common.Interfaces;

public sealed record KeycloakUser(UserId Id, string Email, string? DisplayName);

public interface IKeycloakUserDirectory
{
    Task<KeycloakUser?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    );
}
