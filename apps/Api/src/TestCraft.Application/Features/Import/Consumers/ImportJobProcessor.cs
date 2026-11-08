using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.Import.Consumers;

internal static partial class ImportJobProcessor
{
    public static async Task ProcessAsync(
        IApplicationDbContext dbContext,
        ITestRunNotifier notifier,
        ILogger logger,
        ImportJobId jobId,
        string format,
        Func<Task<TestRunResponse>> import,
        CancellationToken cancellationToken
    )
    {
        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(
            importJob => importJob.Id == jobId,
            cancellationToken
        );

        if (job is null)
        {
            LogJobNotFound(logger, jobId);

            return;
        }

        job.MarkProcessing();

        await dbContext.SaveChangesAsync(cancellationToken);

        TestRunResponse run;
        try
        {
            run = await import();
        }
        catch (DomainException ex)
        {
            LogImportFailed(logger, ex, format, jobId);

            await ImportRunWriter.MarkJobFailedAsync(
                dbContext,
                jobId,
                ex.Message,
                cancellationToken
            );

            return;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogImportFailed(logger, ex, format, jobId);

            await ImportRunWriter.MarkJobFailedAsync(
                dbContext,
                jobId,
                "Import failed due to an unexpected error",
                cancellationToken
            );

            return;
        }

        try
        {
            await notifier.RunStatusChangedAsync(run.Id, run.Status, cancellationToken);
            await notifier.DashboardChangedAsync(run.ProjectId, run.Id, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogNotifyFailed(logger, ex, jobId);
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Import job {JobId} completed but its live update was not sent"
    )]
    private static partial void LogNotifyFailed(
        ILogger logger,
        Exception exception,
        ImportJobId jobId
    );

    [LoggerMessage(Level = LogLevel.Warning, Message = "Import job {JobId} not found")]
    private static partial void LogJobNotFound(ILogger logger, ImportJobId jobId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "{Format} import job {JobId} failed")]
    private static partial void LogImportFailed(
        ILogger logger,
        Exception exception,
        string format,
        ImportJobId jobId
    );
}
