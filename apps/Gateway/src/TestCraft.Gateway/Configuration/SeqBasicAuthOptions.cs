using TestCraft.Common.Security;

namespace TestCraft.Gateway.Configuration;

public sealed class SeqBasicAuthOptions : IBasicAuthCredentials
{
    public string Realm => "TestCraft Logs";

    public string? SeqBasicAuthUsername { get; init; }

    public string? SeqBasicAuthPassword { get; init; }

    public string? Username => SeqBasicAuthUsername;

    public string? Password => SeqBasicAuthPassword;

    public static SeqBasicAuthOptions Bind(IConfiguration configuration) =>
        new()
        {
            SeqBasicAuthUsername = configuration["SEQ_BASIC_AUTH_USERNAME"],
            SeqBasicAuthPassword = configuration["SEQ_BASIC_AUTH_PASSWORD"],
        };
}
