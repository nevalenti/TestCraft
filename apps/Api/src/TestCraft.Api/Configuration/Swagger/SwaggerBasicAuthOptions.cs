using TestCraft.Api.Middleware;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Swagger;

public sealed class SwaggerBasicAuthOptions : IStartupOptions, IBasicAuthCredentials
{
    [NotSensitive]
    public string Realm => "TestCraft API Docs";

    [NotSensitive]
    public string? SwaggerBasicAuthUsername { get; init; }

    [Sensitive]
    public string? SwaggerBasicAuthPassword { get; init; }

    [NotSensitive]
    public string? Username => SwaggerBasicAuthUsername;

    [Sensitive]
    public string? Password => SwaggerBasicAuthPassword;

    public static SwaggerBasicAuthOptions Bind(IConfiguration configuration) =>
        OptionsValidator.ValidateAndThrow(
            new SwaggerBasicAuthOptions
            {
                SwaggerBasicAuthUsername = configuration["SWAGGER_BASIC_AUTH_USERNAME"],
                SwaggerBasicAuthPassword = configuration["SWAGGER_BASIC_AUTH_PASSWORD"],
            },
            "Swagger basic-auth"
        );
}
