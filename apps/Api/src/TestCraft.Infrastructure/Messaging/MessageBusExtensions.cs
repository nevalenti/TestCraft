using MassTransit;

using Microsoft.Extensions.DependencyInjection;

using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Messaging;

public static class MessageBusExtensions
{
    public static IServiceCollection AddMessageBus(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        services.AddMassTransit(busConfig =>
        {
            busConfig.AddConsumers(typeof(Application.DependencyInjection).Assembly);

            if (options.IsRabbitMqConfigured)
            {
                busConfig.UsingRabbitMq(
                    (context, config) =>
                    {
                        config.Host(new Uri(options.RabbitMqUrl));
                        config.UseMessageRetry(retry =>
                            retry.Exponential(
                                retryLimit: 3,
                                minInterval: TimeSpan.FromSeconds(1),
                                maxInterval: TimeSpan.FromSeconds(30),
                                intervalDelta: TimeSpan.FromSeconds(5)
                            )
                        );
                        config.ConfigureEndpoints(context);
                    }
                );
            }
            else
            {
                busConfig.UsingInMemory(
                    (context, config) =>
                    {
                        config.UseMessageRetry(retry => retry.Immediate(3));
                        config.ConfigureEndpoints(context);
                    }
                );
            }
        });

        return services;
    }
}
