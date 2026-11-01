using Microsoft.Extensions.DependencyInjection;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Auth;

public static class AuthExtensions
{
    public static IServiceCollection AddAuth(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        services.AddSingleton<IApiTokenHasher, ApiTokenHasher>();

        services
            .AddHttpClient("keycloak-admin")
            .ConfigurePrimaryHttpMessageHandler(() =>
                KeycloakHttp.CreateHandler(options.KeycloakVerifyTls)
            )
            .AddStandardResilienceHandler();
        services.AddSingleton<IKeycloakAdminTokenProvider, KeycloakAdminTokenProvider>();
        services.AddScoped<IKeycloakUserDirectory, KeycloakUserDirectory>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        return services;
    }
}
