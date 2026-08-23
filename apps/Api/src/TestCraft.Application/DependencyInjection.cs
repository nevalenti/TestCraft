using FluentValidation;

using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Behaviours;
using TestCraft.Application.Features.ShareTokens;

namespace TestCraft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            config.AddOpenBehavior(typeof(ProjectAuthorizationBehaviour<,>));
            config.AddOpenBehavior(typeof(ValidationBehaviour<,>));
        });

        services.AddScoped<ExpiredShareTokenCleanupJob>();

        return services;
    }
}
