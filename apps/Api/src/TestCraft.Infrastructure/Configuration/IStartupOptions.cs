using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Common.Configuration;

namespace TestCraft.Infrastructure.Configuration;

public interface IStartupOptions;

public static class StartupOptionsServiceCollectionExtensions
{
    public static T AddStartupOptions<T>(
        this IServiceCollection services,
        IConfiguration configuration
    )
        where T : class, IStartupOptions, new()
    {
        var options = services.AddValidatedOptions<T>(configuration);
        services.AddSingleton<IStartupOptions>(options);

        return options;
    }
}
