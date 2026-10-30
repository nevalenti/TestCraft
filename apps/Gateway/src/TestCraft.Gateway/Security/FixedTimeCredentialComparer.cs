using System.Security.Cryptography;
using System.Text;

namespace TestCraft.Gateway.Security;

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
