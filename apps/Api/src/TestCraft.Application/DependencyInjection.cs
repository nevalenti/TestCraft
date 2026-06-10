using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Application.Common.Behaviours;

namespace TestCraft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(
        this IServiceCollection services
    )
    {
        services.AddValidatorsFromAssembly(
            typeof(DependencyInjection).Assembly
        );

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(
                typeof(DependencyInjection).Assembly
            );
            cfg.AddOpenBehavior(typeof(ProjectAuthorizationBehaviour<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehaviour<,>));
        });

        return services;
    }
}
