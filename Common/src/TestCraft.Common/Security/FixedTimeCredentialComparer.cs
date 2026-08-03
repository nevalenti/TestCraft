using System.Security.Cryptography;
using System.Text;

namespace TestCraft.Common.Security;

/// <summary>Compares secrets in constant time to avoid leaking their length/content via timing.</summary>
public static class FixedTimeCredentialComparer
{
    public static bool Equals(string actual, string expected) =>
        Equals(
            Encoding.UTF8.GetBytes(actual),
            Encoding.UTF8.GetBytes(expected)
        );

    public static bool Equals(byte[] actual, byte[] expected) =>
        actual.Length == expected.Length
        && CryptographicOperations.FixedTimeEquals(actual, expected);
}
