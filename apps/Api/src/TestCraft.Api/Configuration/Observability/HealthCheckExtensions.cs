using System.Text.Json;

using HealthChecks.NpgSql;

using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

using RabbitMQ.Client;

using TestCraft.Infrastructure.Caching;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Persistence;

namespace TestCraft.Api.Configuration.Observability;

public static class HealthCheckExtensions
{
    private const string ReadyTag = "ready";

    public static WebApplicationBuilder AddObservabilityHealthChecks(
        this WebApplicationBuilder builder,
        InfrastructureOptions options
    )
    {
        var healthChecks = builder
            .Services.AddHealthChecks()
            .AddNpgSql(
                ConnectionStringHelpers.ToNpgsqlConnectionString(options.DatabaseUrl),
                name: "postgres",
                tags: [ReadyTag]
            )
            .AddHangfire(
                setup => setup.MinimumAvailableServers = 1,
                name: "hangfire",
                tags: [ReadyTag]
            );

        if (!string.IsNullOrEmpty(options.RedisUrl))
        {
            healthChecks.AddRedis(
                RedisConnectionStringHelpers.ToRedisConfiguration(options.RedisUrl),
                name: "redis",
                tags: [ReadyTag]
            );
        }

        if (!string.IsNullOrEmpty(options.RabbitMqUrl))
        {
            var rabbitMqConnection = new RabbitMqConnectionHolder(options.RabbitMqUrl);

            healthChecks.AddRabbitMQ(
                _ => rabbitMqConnection.GetConnectionAsync(),
                name: "rabbitmq",
                tags: [ReadyTag]
            );
        }

        return builder;
    }

    private sealed class RabbitMqConnectionHolder(string url)
    {
        private readonly Lock _lock = new();
        private Task<IConnection>? _connection;

        public Task<IConnection> GetConnectionAsync()
        {
            lock (_lock)
            {
                if (_connection is null || _connection.IsFaulted)
                {
                    _connection = new ConnectionFactory
                    {
                        Uri = new Uri(url),
                    }.CreateConnectionAsync();
                }

                return _connection;
            }
        }
    }

    public static WebApplication UseObservabilityHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks(
            "/api/ready",
            new HealthCheckOptions
            {
                Predicate = _ => false,
                ResponseWriter = (context, _) => WriteStatusAsync(context, "ok"),
            }
        );

        app.MapHealthChecks(
            "/api/health",
            new HealthCheckOptions
            {
                Predicate = check => check.Tags.Contains(ReadyTag),
                ResponseWriter = (context, report) =>
                    WriteStatusAsync(
                        context,
                        report.Status == HealthStatus.Healthy ? "healthy" : "unhealthy"
                    ),
            }
        );

        return app;
    }

    private static Task WriteStatusAsync(HttpContext context, string status)
    {
        context.Response.ContentType = "application/json";

        return context.Response.WriteAsync(JsonSerializer.Serialize(new { status }));
    }
}
