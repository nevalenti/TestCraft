using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Auth;

public static class AuthExtensions
{
    public static void AddAuth(this IServiceCollection services)
    {
        services.AddSingleton<IApiTokenHasher, ApiTokenHasher>();

        services.AddHttpClient("keycloak-admin").AddStandardResilienceHandler();
        services.AddSingleton<IKeycloakAdminTokenProvider, KeycloakAdminTokenProvider>();
        services.AddScoped<IKeycloakUserDirectory, KeycloakUserDirectory>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
    }
}
