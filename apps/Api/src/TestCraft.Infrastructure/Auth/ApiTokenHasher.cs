using System.Security.Cryptography;
using System.Text;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Infrastructure.Security;

namespace TestCraft.Infrastructure.Auth;

public class ApiTokenHasher : IApiTokenHasher
{
    public string GenerateToken() =>
        Convert
            .ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

    public string Hash(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public bool Verify(string token, string hash) =>
        FixedTimeCredentialComparer.Equals(
            Convert.FromHexString(Hash(token)),
            Convert.FromHexString(hash)
        );
}
