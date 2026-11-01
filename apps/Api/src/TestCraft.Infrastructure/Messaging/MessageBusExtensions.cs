using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Infrastructure.Messaging;

public static class MessageBusExtensions
{
    public static IServiceCollection AddMessageBus<TDbContext>(
        this IServiceCollection services,
        InfrastructureOptions options
    )
        where TDbContext : DbContext
    {
        services.AddMassTransit(busConfig =>
        {
            busConfig.AddConsumers(typeof(Application.DependencyInjection).Assembly);
            busConfig.AddEntityFrameworkOutbox<TDbContext>(outbox =>
            {
                outbox.UsePostgres();
                outbox.UseBusOutbox();
            });
            busConfig.AddConfigureEndpointsCallback(
                (context, _, endpoint) => endpoint.UseInMemoryOutbox(context)
            );

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
