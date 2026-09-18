namespace TestCraft.Common.Security;

public interface IBasicAuthCredentials
{
    string Realm { get; }
    string? Username { get; }
    string? Password { get; }
}
