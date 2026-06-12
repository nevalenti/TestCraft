using Microsoft.EntityFrameworkCore;
using Npgsql;
using Polly;
using Polly.Retry;
using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.Configuration;

public static partial class DatabaseMigrationExtensions
{
    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        var apiOptions = app.Services.GetRequiredService<ApiOptions>();
        if (!apiOptions.ApplyMigrations)
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var pipeline = new ResiliencePipelineBuilder()
            .AddRetry(
                new RetryStrategyOptions
                {
                    ShouldHandle = new PredicateBuilder().Handle<NpgsqlException>(),
                    MaxRetryAttempts = 5,
                    Delay = TimeSpan.FromSeconds(5),
                    BackoffType = DelayBackoffType.Constant,
                    OnRetry = args =>
                    {
                        LogMigrationRetry(
                            app.Logger,
                            args.Outcome.Exception,
                            args.AttemptNumber + 1
                        );
                        return ValueTask.CompletedTask;
                    },
                }
            )
            .Build();

        await pipeline.ExecuteAsync(async cancellationToken =>
            await dbContext.Database.MigrateAsync(cancellationToken)
        );
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Database not ready (attempt {Attempt}/6), retrying in 5s"
    )]
    private static partial void LogMigrationRetry(
        ILogger logger,
        Exception? exception,
        int attempt
    );
}
