using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Infrastructure.Auth;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.Email;
using TestCraft.Infrastructure.Messaging;
using TestCraft.Infrastructure.Notifications;
using TestCraft.Infrastructure.Storage;

namespace TestCraft.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure<TDbContext>(
        this IServiceCollection services,
        InfrastructureOptions options
    )
        where TDbContext : DbContext
    {
        services
            .AddCaching(options)
            .AddMessageBus<TDbContext>(options)
            .AddStorage(options)
            .AddEmail(options)
            .AddNotifications(options)
            .AddAuth(options);

        return services;
    }
}
