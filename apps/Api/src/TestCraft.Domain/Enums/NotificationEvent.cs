using System.Text.Json;
using System.Text.Json.Serialization;

namespace TestCraft.Domain.Enums;

[JsonConverter(typeof(JsonStringEnumConverter<NotificationEvent>))]
public enum NotificationEvent
{
    [JsonStringEnumMemberName("run.completed")]
    RunCompleted,
}

public static class NotificationEvents
{
    public static string Serialize(IEnumerable<NotificationEvent> events) =>
        JsonSerializer.Serialize(events.Distinct().ToArray());

    public static IReadOnlyList<NotificationEvent> Parse(string stored) =>
        JsonSerializer.Deserialize<NotificationEvent[]>(stored) ?? [];
}
