using AutoMapper;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Import.Contracts;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import.Consumers;

public partial class ImportJUnitRequestedConsumer(
    IApplicationDbContext dbContext,
    IMapper mapper,
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

            var run = await ImportRunWriter.CreateRunWithResultsAsync(
                dbContext,
                mapper,
                message.ProjectId,
                message.Name ?? runName,
                message.Environment,
                TestRunStatus.Completed,
                cases,
                message.UserId,
                message.Source?.ToLowerInvariant(),
                cancellationToken
            );

            job.Status = ImportJobStatus.Completed;
            job.TestRunId = run.Id;
        }
        catch (Exception ex)
        {
            LogImportFailed(logger, ex, job.Id);

            job.Status = ImportJobStatus.Failed;
            job.Error = ex.Message;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Import job {JobId} not found")]
    private static partial void LogJobNotFound(ILogger logger, Guid jobId);

    [LoggerMessage(Level = LogLevel.Warning, Message = "JUnit import job {JobId} failed")]
    private static partial void LogImportFailed(ILogger logger, Exception exception, Guid jobId);
}
