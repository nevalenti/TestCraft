using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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
        var options = configuration.Get<T>() ?? new T();
        var result = new DataAnnotationValidateOptions<T>(Options.DefaultName).Validate(
            Options.DefaultName,
            options
        );
        if (result.Failed)
        {
            throw new OptionsValidationException(Options.DefaultName, typeof(T), result.Failures);
        }

        services.AddSingleton(Options.Create(options));
        services.AddSingleton<IStartupOptions>(options);

        return options;
    }
}
