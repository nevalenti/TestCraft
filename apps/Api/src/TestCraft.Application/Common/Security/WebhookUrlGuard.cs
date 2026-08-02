using System.Net;
using System.Net.Sockets;

namespace TestCraft.Application.Common.Security;

/// <summary>
/// Validates that a webhook URL is a well-formed public http(s) endpoint, guarding against
/// SSRF via URLs that target loopback, private, link-local, or other non-routable addresses.
/// </summary>
public static class WebhookUrlGuard
{
    public static bool IsAllowed(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        if (uri.HostNameType == UriHostNameType.IPv4 || uri.HostNameType == UriHostNameType.IPv6)
        {
            return IPAddress.TryParse(uri.Host, out var address) && IsPublicAddress(address);
        }

        return !uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsPublicAddress(IPAddress address)
    {
        if (
            IPAddress.IsLoopback(address)
            || address.IsIPv6LinkLocal
            || address.IsIPv6SiteLocal
            || address.IsIPv6Multicast
        )
        {
            return false;
        }

        if (address.AddressFamily == AddressFamily.InterNetwork)
        {
            var octets = address.GetAddressBytes();

            return octets switch
            {
                [10, ..] => false,
                [172, >= 16 and <= 31, ..] => false,
                [192, 168, ..] => false,
                [169, 254, ..] => false,
                [0, ..] => false,
                _ => true,
            };
        }

        return true;
    }
}
