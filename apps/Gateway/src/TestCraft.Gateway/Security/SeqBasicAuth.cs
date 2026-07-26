using System.Security.Cryptography;
using System.Text;
using TestCraft.Gateway.Configuration;

namespace TestCraft.Gateway.Security;

public static class SeqBasicAuth
{
    public static bool IsAuthorized(
        string authorizationHeader,
        SeqBasicAuthOptions options
    )
    {
        var expectedUsername = options.SeqBasicAuthUsername;
        var expectedPassword = options.SeqBasicAuthPassword;

        if (
            string.IsNullOrEmpty(expectedUsername)
            || string.IsNullOrEmpty(expectedPassword)
        )
        {
            return false;
        }

        const string prefix = "Basic ";
        if (!authorizationHeader.StartsWith(prefix, StringComparison.Ordinal))
        {
            return false;
        }

        string credentials;
        try
        {
            credentials = Encoding.UTF8.GetString(
                Convert.FromBase64String(authorizationHeader[prefix.Length..])
            );
        }
        catch (FormatException)
        {
            return false;
        }

        var separatorIndex = credentials.IndexOf(':', StringComparison.Ordinal);
        if (separatorIndex < 0)
        {
            return false;
        }

        var username = credentials[..separatorIndex];
        var password = credentials[(separatorIndex + 1)..];

        return FixedTimeEquals(username, expectedUsername)
            && FixedTimeEquals(password, expectedPassword);
    }

    private static bool FixedTimeEquals(string actual, string expected)
    {
        var actualBytes = Encoding.UTF8.GetBytes(actual);
        var expectedBytes = Encoding.UTF8.GetBytes(expected);

        return actualBytes.Length == expectedBytes.Length
            && CryptographicOperations.FixedTimeEquals(
                actualBytes,
                expectedBytes
            );
    }
}
