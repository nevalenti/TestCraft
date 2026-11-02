using StackExchange.Redis;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Realtime;

public static class RealtimeExtensions
{
    public static WebApplicationBuilder AddRealtime(
        this WebApplicationBuilder builder,
        InfrastructureOptions options
    )
    {
        var services = builder.Services;
        var maxConnectionsPerUser = builder.Configuration.GetValue(
            "WS_MAX_CONNECTIONS_PER_USER",
            20
        );

        services.AddSingleton<RunEventBroker>();
        services.AddSingleton<SocketTickets>();
        services.AddSingleton<RealtimeSocketServer>();
        services.AddSingleton<ITestRunNotifier, BrokerTestRunNotifier>();

        if (string.IsNullOrEmpty(options.RedisUrl))
        {
            services.AddSingleton<ISocketTicketStore, InMemorySocketTicketStore>();
            services.AddSingleton<IConnectionSlots>(
                new InMemoryConnectionSlots(maxConnectionsPerUser)
            );
            services.AddSingleton<IRunEventPublisher, LocalRunEventPublisher>();

            return builder;
        }

        var redisOptions = RedisConnectionStringHelpers.ToRedisConfigurationOptions(
            options.RedisUrl
        );
        redisOptions.AbortOnConnectFail = false;
        var redisTimeout = (int)TimeSpan.FromSeconds(options.RedisTimeoutSeconds).TotalMilliseconds;
        redisOptions.ConnectTimeout = redisTimeout;
        redisOptions.SyncTimeout = redisTimeout;
        redisOptions.AsyncTimeout = redisTimeout;

        services.AddSingleton<IConnectionMultiplexer>(_ =>
            ConnectionMultiplexer.Connect(redisOptions)
        );
        services.AddSingleton<ISocketTicketStore, RedisSocketTicketStore>();
        services.AddSingleton<IConnectionSlots>(provider => new RedisConnectionSlots(
            provider.GetRequiredService<IConnectionMultiplexer>(),
            maxConnectionsPerUser
        ));
        services.AddSingleton<IRunEventPublisher, RedisRunEventPublisher>();
        services.AddHostedService<RedisRunEventRelay>();

        return builder;
    }
}
