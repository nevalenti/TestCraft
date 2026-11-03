using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Import.Contracts;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.Import.Consumers;

public partial class ImportJUnitRequestedConsumer(
    IApplicationDbContext dbContext,
    ITestRunNotifier notifier,
    ILogger<ImportJUnitRequestedConsumer> logger,
    TimeProvider timeProvider
) : IConsumer<ImportJUnitRequested>
{
    public async Task Consume(ConsumeContext<ImportJUnitRequested> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(
            importJob => importJob.Id == message.JobId,
            cancellationToken
        );

        if (job is null)
        {
            LogJobNotFound(logger, message.JobId);

            return;
        }

        job.MarkProcessing();

        await dbContext.SaveChangesAsync(cancellationToken);

        TestRunResponse run;
        try
        {
            var (runName, cases) = JUnitParser.Parse(message.Xml);

            var batch = new ImportBatch(
                message.ProjectId,
                message.UserId,
                message.Source?.ToLowerInvariant(),
                job.Id,
                timeProvider.GetStoredUtcNow()
            );

            if (message.RunId.HasValue)
            {
                run = await ImportRunWriter.AppendResultsToRunAsync(
                    dbContext,
                    batch,
                    message.RunId.Value,
                    cases,
                    cancellationToken
                );
            }
            else
            {
                run = await ImportRunWriter.CreateRunWithResultsAsync(
                    dbContext,
                    batch,
                    message.Name ?? runName,
                    message.Environment,
                    TestRunStatus.Completed,
                    cases,
                    message.UserName,
                    cancellationToken
                );
            }
        }
        catch (DomainException ex)
        {
            LogImportFailed(logger, ex, job.Id);

            await ImportRunWriter.MarkJobFailedAsync(
                dbContext,
                job.Id,
                ex.Message,
                cancellationToken
            );

            return;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogImportFailed(logger, ex, job.Id);

            await ImportRunWriter.MarkJobFailedAsync(
                dbContext,
                job.Id,
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
            LogNotifyFailed(logger, ex, job.Id);
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

    [LoggerMessage(Level = LogLevel.Warning, Message = "JUnit import job {JobId} failed")]
    private static partial void LogImportFailed(
        ILogger logger,
        Exception exception,
        ImportJobId jobId
    );
}
