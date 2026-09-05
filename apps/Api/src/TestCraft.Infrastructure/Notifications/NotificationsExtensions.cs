using System.Net.Http;

using Microsoft.Extensions.DependencyInjection;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Configuration;
using TestCraft.Infrastructure.FeatureToggles;
using TestCraft.Infrastructure.Security;

namespace TestCraft.Infrastructure.Notifications;

public static class NotificationsExtensions
{
    public static IServiceCollection AddNotifications(
        this IServiceCollection services,
        InfrastructureOptions options
    )
    {
        services.AddKeyedSingleton<IFeatureToggle>(
            FeatureToggleNames.NotificationDeliveryRetry,
            new FeatureToggle(options.NotificationDeliveryRetryEnabled)
        );
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

        services
            .AddHttpClient("notifications")
            .ConfigurePrimaryHttpMessageHandler(() =>
                new SocketsHttpHandler { ConnectCallback = SafeWebhookConnectCallback.ConnectAsync }
            )
            .AddStandardResilienceHandler();

        return services;
    }
}
