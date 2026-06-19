using MassTransit;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Notifications.Contracts;

namespace TestCraft.Application.Notifications.Consumers;

public partial class RunStatusChangedConsumer(
    INotificationDispatcher dispatcher,
    ILogger<RunStatusChangedConsumer> logger
) : IConsumer<RunStatusChanged>
{
    public async Task Consume(ConsumeContext<RunStatusChanged> context)
    {
        var msg = context.Message;

        if (msg.NewStatus == "Completed")
        {
            try
            {
                await dispatcher.DispatchRunCompletedAsync(
                    msg.ProjectId,
                    msg.RunId,
                    msg.RunName,
                    context.CancellationToken
                );
            }
            catch (Exception ex)
            {
                LogDispatchFailed(logger, ex, msg.RunId);
            }
        }
    }

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Notification dispatch failed for run {RunId}"
    )]
    private static partial void LogDispatchFailed(ILogger logger, Exception exception, Guid runId);
}
