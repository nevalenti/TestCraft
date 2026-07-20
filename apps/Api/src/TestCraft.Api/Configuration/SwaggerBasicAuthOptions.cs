using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration;

public sealed class SwaggerBasicAuthOptions
{
    public string? SwaggerBasicAuthUsername { get; init; }

    [Sensitive]
    public string? SwaggerBasicAuthPassword { get; init; }

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
