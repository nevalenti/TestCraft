using TestCraft.Common.Security;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class SwaggerBasicAuthOptions : IStartupOptions, IBasicAuthCredentials
{
    [NotSensitive]
    public string Realm => "TestCraft API Docs";

    [NotSensitive]
    [ConfigurationKeyName("SWAGGER_BASIC_AUTH_USERNAME")]
    public string? SwaggerBasicAuthUsername { get; set; }

    [Sensitive]
    [ConfigurationKeyName("SWAGGER_BASIC_AUTH_PASSWORD")]
    public string? SwaggerBasicAuthPassword { get; set; }

    [NotSensitive]
    public string? Username => SwaggerBasicAuthUsername;

    [Sensitive]
    public string? Password => SwaggerBasicAuthPassword;
}
