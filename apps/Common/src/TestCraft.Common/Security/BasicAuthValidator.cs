using System.Text;

namespace TestCraft.Common.Security;

public static class BasicAuthValidator
{
    public static bool IsAuthorized(
        string authorizationHeader,
        string? expectedUsername,
        string? expectedPassword
    )
    {
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

        return FixedTimeCredentialComparer.Equals(username, expectedUsername)
            && FixedTimeCredentialComparer.Equals(password, expectedPassword);
    }
}
