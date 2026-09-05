using FluentValidation;

using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Behaviours;
using TestCraft.Application.Features.Notifications;
using TestCraft.Application.Features.ShareTokens;

namespace TestCraft.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly)
                .AddOpenBehavior(typeof(ProjectAuthorizationBehaviour<,>))
                .AddOpenBehavior(typeof(ValidationBehaviour<,>))
                .AddOpenBehavior(typeof(PerformanceBehaviour<,>));
        });

        services.AddScoped<ExpiredShareTokenCleanupJob>();
        services.AddScoped<NotificationDeliveryRetryJob>();
        services.AddScoped<NotificationDeliveryCleanupJob>();

        return services;
    }
}
