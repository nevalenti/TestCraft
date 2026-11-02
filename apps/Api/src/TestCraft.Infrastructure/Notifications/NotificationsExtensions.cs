using System.Net.Http;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Security;

namespace TestCraft.Infrastructure.Notifications;

public static class NotificationsExtensions
{
    public static IServiceCollection AddNotifications(this IServiceCollection services)
    {
        services.AddScoped<INotificationDispatcher, NotificationDispatcher>();

        services
            .AddHttpClient("notifications", client => client.Timeout = TimeSpan.FromSeconds(10))
            .ConfigurePrimaryHttpMessageHandler(() =>
                new SocketsHttpHandler
                {
                    ConnectCallback = SafeWebhookConnectCallback.ConnectAsync,
                    AllowAutoRedirect = false,
                }
            );

        return services;
    }
}
