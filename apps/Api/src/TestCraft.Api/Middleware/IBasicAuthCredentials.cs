namespace TestCraft.Api.Middleware;

public interface IBasicAuthCredentials
{
    string Realm { get; }
    string? Username { get; }
    string? Password { get; }
}
