using MassTransit;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Import.Contracts;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Import.Consumers;

public sealed class ImportJUnitRequestedConsumer(
    IApplicationDbContext dbContext,
    ITestRunNotifier notifier,
    ILogger<ImportJUnitRequestedConsumer> logger,
    TimeProvider timeProvider
) : IConsumer<ImportJUnitRequested>
{
    public Task Consume(ConsumeContext<ImportJUnitRequested> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        return ImportJobProcessor.ProcessAsync(
            dbContext,
            notifier,
            logger,
            message.JobId,
            "JUnit",
            () => ImportAsync(message, cancellationToken),
            cancellationToken
        );
    }

    private Task<TestRunResponse> ImportAsync(
        ImportJUnitRequested message,
        CancellationToken cancellationToken
    )
    {
        var (runName, cases) = JUnitParser.Parse(message.Xml);

        var batch = new ImportBatch(
            message.ProjectId,
            message.UserId,
            message.Source?.ToLowerInvariant(),
            message.JobId,
            timeProvider.GetStoredUtcNow()
        );

        return message.RunId is { } runId
            ? ImportRunWriter.AppendResultsToRunAsync(
                dbContext,
                batch,
                runId,
                cases,
                cancellationToken
            )
            : ImportRunWriter.CreateRunWithResultsAsync(
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
