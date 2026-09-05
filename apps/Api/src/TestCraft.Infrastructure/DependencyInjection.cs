using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.Email;
using TestCraft.Infrastructure.Messaging;
using TestCraft.Infrastructure.Notifications;
using TestCraft.Infrastructure.Storage;
using TestCraft.Persistence;

namespace TestCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var options = InfrastructureOptions.Bind(configuration);

        services.AddStartupOptions(options);

        services.AddPersistence(
            ConnectionStringHelpers.ToNpgsqlConnectionString(options.DatabaseUrl)
        );

        services
            .AddCaching(options)
            .AddMessageBus(options)
            .AddStorage(options)
            .AddEmail(options)
            .AddNotifications(options)
            .AddAuth();

        return services;
    }
}
