using Microsoft.Extensions.Options;

namespace TestCraft.Gateway.Configuration;

public static class StartupOptionsExtensions
{
    public static T AddStartupOptions<T>(
        this IServiceCollection services,
        IConfiguration configuration
    )
        where T : class, new()
    {
        var options = configuration.Get<T>() ?? new T();
        var result = new DataAnnotationValidateOptions<T>(
            Options.DefaultName
        ).Validate(Options.DefaultName, options);
        if (result.Failed)
        {
            throw new OptionsValidationException(
                Options.DefaultName,
                typeof(T),
                result.Failures
            );
        }

        services.AddSingleton(Options.Create(options));

        return options;
    }
}
