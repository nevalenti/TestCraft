using TestCraft.Api.Middleware;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Hangfire;

public sealed class HangfireBasicAuthOptions : IStartupOptions, IBasicAuthCredentials
{
    [NotSensitive]
    public string Realm => "TestCraft Hangfire Dashboard";

    [NotSensitive]
    public string? HangfireBasicAuthUsername { get; init; }

    [Sensitive]
    public string? HangfireBasicAuthPassword { get; init; }

    [NotSensitive]
    public string? Username => HangfireBasicAuthUsername;

    [Sensitive]
    public string? Password => HangfireBasicAuthPassword;

    public static HangfireBasicAuthOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new HangfireBasicAuthOptions
            {
                HangfireBasicAuthUsername = configuration["HANGFIRE_BASIC_AUTH_USERNAME"],
                HangfireBasicAuthPassword = configuration["HANGFIRE_BASIC_AUTH_PASSWORD"],
            },
            "Hangfire basic-auth"
        );
}
