namespace TestCraft.Application.Common.Extensions;

public static class TimeProviderExtensions
{
    public static DateTimeOffset GetStoredUtcNow(this TimeProvider timeProvider)
    {
        var now = timeProvider.GetUtcNow();

        return now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
    }
}
