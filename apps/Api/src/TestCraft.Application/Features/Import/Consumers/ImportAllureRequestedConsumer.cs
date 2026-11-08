using MassTransit;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Features.Import.Contracts;
using TestCraft.Application.Features.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Features.Import.Consumers;

public sealed class ImportAllureRequestedConsumer(
    IApplicationDbContext dbContext,
    ITestRunNotifier notifier,
    ILogger<ImportAllureRequestedConsumer> logger,
    TimeProvider timeProvider
) : IConsumer<ImportAllureRequested>
{
    public Task Consume(ConsumeContext<ImportAllureRequested> context)
    {
        var message = context.Message;
        var cancellationToken = context.CancellationToken;

        return ImportJobProcessor.ProcessAsync(
            dbContext,
            notifier,
            logger,
            message.JobId,
            "Allure",
            () => ImportAsync(message, cancellationToken),
            cancellationToken
        );
    }

    private Task<TestRunResponse> ImportAsync(
        ImportAllureRequested message,
        CancellationToken cancellationToken
    )
    {
        var cases = AllureParser.Parse(message.Results);

        var batch = new ImportBatch(
            message.ProjectId,
            message.UserId,
            message.Source?.ToLowerInvariant(),
            message.JobId,
            timeProvider.GetStoredUtcNow()
        );

        return ImportRunWriter.CreateRunWithResultsAsync(
            dbContext,
            batch,
            message.Name ?? ImportAllure.Command.DefaultRunName,
            message.Environment,
            TestRunStatus.Completed,
            cases,
            message.UserName,
            cancellationToken
        );
    }
}
