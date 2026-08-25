using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using Npgsql;

using Polly;
using Polly.Retry;

namespace TestCraft.Persistence;

public static partial class AppDbContextMigrator
{
    private const int MaxMigrationRetries = 5;
    private static readonly TimeSpan MigrationTimeout = TimeSpan.FromMinutes(10);

    public static async Task MigrateWithRetryAsync(
        AppDbContext dbContext,
        ILogger logger,
        CancellationToken cancellationToken = default
    )
    {
        var pipeline = new ResiliencePipelineBuilder()
            .AddRetry(
                new RetryStrategyOptions
                {
                    ShouldHandle = args => new ValueTask<bool>(
                        args.Outcome.Exception is NpgsqlException or TimeoutException
                    ),
                    MaxRetryAttempts = MaxMigrationRetries,
                    Delay = TimeSpan.FromSeconds(5),
                    BackoffType = DelayBackoffType.Constant,
                    OnRetry = args =>
                    {
                        LogMigrationRetry(
                            logger,
                            args.Outcome.Exception,
                            args.AttemptNumber + 1,
                            MaxMigrationRetries
                        );
                        return ValueTask.CompletedTask;
                    },
                }
            )
            .Build();

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(MigrationTimeout);

        try
        {
            await pipeline.ExecuteAsync(
                async ct => await dbContext.Database.MigrateAsync(ct),
                cts.Token
            );
        }
        catch (Exception exception)
        {
            LogMigrationFailed(logger, exception);
            throw;
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Database not ready (attempt {Attempt}/{MaxAttempts}), retrying in 5s"
    )]
    private static partial void LogMigrationRetry(
        ILogger logger,
        Exception? exception,
        int attempt,
        int maxAttempts
    );

    [LoggerMessage(
        Level = LogLevel.Critical,
        Message = "Database migration failed — refusing to start"
    )]
    private static partial void LogMigrationFailed(ILogger logger, Exception exception);
}
