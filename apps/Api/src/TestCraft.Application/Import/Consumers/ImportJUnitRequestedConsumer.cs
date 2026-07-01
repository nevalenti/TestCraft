using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Import.Contracts;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import.Consumers;

public partial class ImportJUnitRequestedConsumer(
    IApplicationDbContext dbContext,
    ITestRunNotifier notifier,
    ILogger<ImportJUnitRequestedConsumer> logger
) : IConsumer<ImportJUnitRequested>
{
    public async Task Consume(ConsumeContext<ImportJUnitRequested> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        var job = await dbContext.ImportJobs.FirstOrDefaultAsync(
            j => j.Id == message.JobId,
            cancellationToken
        );

        if (job is null)
        {
            LogJobNotFound(logger, message.JobId);

            return;
        }

        job.Status = ImportJobStatus.Processing;
        await dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var (runName, cases) = JUnitParser.Parse(message.Xml);

            TestRunResponse run;
            if (message.RunId.HasValue)
            {
                run = await ImportRunWriter.AppendResultsToRunAsync(
                    dbContext,
                    message.ProjectId,
                    message.RunId.Value,
                    cases,
                    message.UserId,
                    message.Source?.ToLowerInvariant(),
                    job,
                    cancellationToken
                );
            }
            else
            {
                run = await ImportRunWriter.CreateRunWithResultsAsync(
                    dbContext,
                    message.ProjectId,
                    message.Name ?? runName,
                    message.Environment,
                    TestRunStatus.Completed,
                    cases,
                    message.UserId,
                    message.UserName,
                    message.Source?.ToLowerInvariant(),
                    job,
                    cancellationToken
                );
            }

            await notifier.RunStatusChangedAsync(run.Id, run.Status.ToString(), cancellationToken);
        }
        catch (Exception ex)
        {
            LogImportFailed(logger, ex, job.Id);

            job.Status = ImportJobStatus.Failed;
            job.Error = ex.Message;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Import job {JobId} not found")]
    private static partial void LogJobNotFound(ILogger logger, Guid jobId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "JUnit import job {JobId} failed")]
    private static partial void LogImportFailed(ILogger logger, Exception exception, Guid jobId);
}
