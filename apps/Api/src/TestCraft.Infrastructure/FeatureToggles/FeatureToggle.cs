using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.FeatureToggles;

public static class FeatureToggleNames
{
    public const string NotificationDeliveryRetry = "NotificationDeliveryRetry";
}

internal sealed class FeatureToggle(bool isEnabled) : IFeatureToggle
{
    public bool IsEnabled { get; } = isEnabled;
}
