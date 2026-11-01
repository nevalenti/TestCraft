using TestCraft.Common.Security;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Hangfire;

public sealed class HangfireBasicAuthOptions : IStartupOptions, IBasicAuthCredentials
{
    [NotSensitive]
    public string Realm => "TestCraft Hangfire Dashboard";

    [NotSensitive]
    [ConfigurationKeyName("HANGFIRE_BASIC_AUTH_USERNAME")]
    public string? HangfireBasicAuthUsername { get; set; }

    [Sensitive]
    [ConfigurationKeyName("HANGFIRE_BASIC_AUTH_PASSWORD")]
    public string? HangfireBasicAuthPassword { get; set; }

    [NotSensitive]
    public string? Username => HangfireBasicAuthUsername;

    [Sensitive]
    public string? Password => HangfireBasicAuthPassword;
}
