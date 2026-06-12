namespace TestCraft.Api.Configuration;

public static class CorsExtensions
{
    public const string DefaultPolicyName = "Default";

    public static WebApplicationBuilder AddCorsPolicy(
        this WebApplicationBuilder builder,
        ApiOptions apiOptions
    )
    {
        builder.Services.AddCors(options =>
        {
            options.AddPolicy(
                DefaultPolicyName,
                policy =>
                    policy
                        .WithOrigins(apiOptions.CorsAllowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
            );
        });

        return builder;
    }
}
