namespace TestCraft.Infrastructure.Notifications;

internal readonly record struct DeliveryAttemptResult(
    bool Success,
    string? Error,
    Exception? Exception = null
)
{
    public static readonly DeliveryAttemptResult Ok = new(true, null);

    public static DeliveryAttemptResult Fail(string error, Exception? exception = null) =>
        new(false, error, exception);
}
