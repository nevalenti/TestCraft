namespace TestCraft.Gateway.Configuration;

public sealed class SeqBasicAuthOptions
{
    public string? SeqBasicAuthUsername { get; init; }

    public string? SeqBasicAuthPassword { get; init; }

    public static SeqBasicAuthOptions Bind(IConfiguration configuration) =>
        new()
        {
            SeqBasicAuthUsername = configuration["SEQ_BASIC_AUTH_USERNAME"],
            SeqBasicAuthPassword = configuration["SEQ_BASIC_AUTH_PASSWORD"],
        };
}
