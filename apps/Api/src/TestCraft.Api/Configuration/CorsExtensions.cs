namespace TestCraft.Api.Configuration;

public static class CorsExtensions
{
    public const string DefaultPolicyName = "Default";

    public static WebApplicationBuilder AddCorsPolicy(this WebApplicationBuilder builder)
    {
        var corsOrigins = (builder.Configuration["CORS_ALLOWED_ORIGINS"] ?? string.Empty).Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        );

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(
                DefaultPolicyName,
                policy =>
                    policy
                        .WithOrigins(corsOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
            );
        });

        return builder;
    }
}
