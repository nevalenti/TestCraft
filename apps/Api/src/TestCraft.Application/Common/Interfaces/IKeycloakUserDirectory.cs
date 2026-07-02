namespace TestCraft.Application.Common.Interfaces;

public sealed record KeycloakUser(Guid Id, string Email, string? DisplayName);

public interface IKeycloakUserDirectory
{
    Task<KeycloakUser?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default
    );
}
