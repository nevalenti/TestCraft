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

public partial class ImportAllureRequestedConsumer(
    IApplicationDbContext dbContext,
    ITestRunNotifier notifier,
    ILogger<ImportAllureRequestedConsumer> logger,
    TimeProvider timeProvider
) : IConsumer<ImportAllureRequested>
{
    public async Task Consume(ConsumeContext<ImportAllureRequested> context)
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
            var cases = AllureParser.Parse(message.Results);

            run = await ImportRunWriter.CreateRunWithResultsAsync(
                dbContext,
                message.ProjectId,
                message.Name ?? ImportAllure.Command.DefaultRunName,
                message.Environment,
                TestRunStatus.Completed,
                cases,
                message.UserId,
                message.UserName,
                message.Source?.ToLowerInvariant(),
                job.Id,
                timeProvider.GetStoredUtcNow(),
                cancellationToken
            );
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

    [LoggerMessage(Level = LogLevel.Warning, Message = "Allure import job {JobId} failed")]
    private static partial void LogImportFailed(
        ILogger logger,
        Exception exception,
        ImportJobId jobId
    );
}
