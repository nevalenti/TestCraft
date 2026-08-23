using Microsoft.EntityFrameworkCore;

using Npgsql;

using Polly;
using Polly.Retry;

using TestCraft.Infrastructure.Persistence;

namespace TestCraft.Api.Configuration.Database;

public static partial class DatabaseMigrationExtensions
{
    private const int MaxMigrationRetries = 5;
    private static readonly TimeSpan MigrationTimeout = TimeSpan.FromMinutes(10);

    public static async Task MigrateDatabaseAsync(this WebApplication app)
    {
        var migrationOptions = app.Services.GetRequiredService<DatabaseMigrationOptions>();
        if (!migrationOptions.ApplyMigrations)
        {
            return;
        }

        using var scope = app.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

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
                            app.Logger,
                            args.Outcome.Exception,
                            args.AttemptNumber + 1,
                            MaxMigrationRetries
                        );
                        return ValueTask.CompletedTask;
                    },
                }
            )
            .Build();

        using var cts = new CancellationTokenSource(MigrationTimeout);
        try
        {
            await pipeline.ExecuteAsync(
                async cancellationToken => await dbContext.Database.MigrateAsync(cancellationToken),
                cts.Token
            );
        }
        catch (Exception exception)
        {
            LogMigrationFailed(app.Logger, exception);
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
