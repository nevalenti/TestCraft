using Prometheus;

using TestCraft.Domain.Enums;

namespace TestCraft.Infrastructure.Notifications;

internal static class NotificationMetrics
{
    private static readonly Counter DeliveriesAbandoned = Metrics.CreateCounter(
        "notification_deliveries_abandoned_total",
        "Total notification deliveries abandoned after exhausting all retry attempts.",
        new CounterConfiguration { LabelNames = ["channel"] }
    );

    public static void RecordAbandoned(NotificationChannel channel) =>
        DeliveriesAbandoned.WithLabels(channel.ToString()).Inc();
}
