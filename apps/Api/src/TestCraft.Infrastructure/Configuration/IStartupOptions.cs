using Microsoft.Extensions.DependencyInjection;

namespace TestCraft.Infrastructure.Configuration;

public interface IStartupOptions;

public static class StartupOptionsServiceCollectionExtensions
{
    public static IServiceCollection AddStartupOptions<T>(
        this IServiceCollection services,
        T options
    )
        where T : class, IStartupOptions
    {
        services.AddSingleton(options);
        services.AddSingleton<IStartupOptions>(options);
        return services;
    }
}
