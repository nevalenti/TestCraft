using System.Net;
using System.Net.Sockets;

namespace TestCraft.Application.Common.Security;

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
        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IsNat64(address))
        {
            address = new IPAddress(address.GetAddressBytes()[12..]);
        }

        if (Is6To4(address))
        {
            address = new IPAddress(address.GetAddressBytes()[2..6]);
        }

        if (IsTeredo(address))
        {
            return false;
        }

        if (
            IPAddress.IsLoopback(address)
            || address.Equals(IPAddress.IPv6Any)
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
                [100, >= 64 and <= 127, ..] => false,
                [172, >= 16 and <= 31, ..] => false,
                [192, 0, 0, _] => false,
                [192, 168, ..] => false,
                [198, 18 or 19, ..] => false,
                [169, 254, ..] => false,
                [0, ..] => false,
                [>= 224, ..] => false,
                _ => true,
            };
        }

        var bytes = address.GetAddressBytes();

        return (bytes[0] & 0xFE) != 0xFC;
    }

    private static bool Is6To4(IPAddress address) =>
        address.AddressFamily == AddressFamily.InterNetworkV6
        && address.GetAddressBytes() is [0x20, 0x02, ..];

    private static bool IsTeredo(IPAddress address) =>
        address.AddressFamily == AddressFamily.InterNetworkV6
        && address.GetAddressBytes() is [0x20, 0x01, 0x00, 0x00, ..];

    private static bool IsNat64(IPAddress address) =>
        address.AddressFamily == AddressFamily.InterNetworkV6
        && address.GetAddressBytes() is [0x00, 0x64, 0xFF, 0x9B, 0, 0, 0, 0, 0, 0, 0, 0, ..];
}
