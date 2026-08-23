using System.Net;
using System.Net.Sockets;

using TestCraft.Application.Common.Security;

namespace TestCraft.Infrastructure.Security;

/// <summary>
/// Connects the "notifications" HttpClient's underlying socket only to a public IP address,
/// re-validated at connect time rather than at webhook-creation time — closing the DNS-rebinding
/// gap where a hostname resolves to a public address at validation time but a private/internal
/// one at delivery time.
/// </summary>
public static class SafeWebhookConnectCallback
{
    public static async ValueTask<Stream> ConnectAsync(
        SocketsHttpConnectionContext context,
        CancellationToken cancellationToken
    )
    {
        var addresses = await Dns.GetHostAddressesAsync(
            context.DnsEndPoint.Host,
            cancellationToken
        );

        var address =
            addresses.FirstOrDefault(WebhookUrlGuard.IsPublicAddress)
            ?? throw new InvalidOperationException(
                $"Refusing to connect to '{context.DnsEndPoint.Host}': "
                    + "no public IP address resolved"
            );

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
        try
        {
            await socket.ConnectAsync(
                new IPEndPoint(address, context.DnsEndPoint.Port),
                cancellationToken
            );

            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }
}
