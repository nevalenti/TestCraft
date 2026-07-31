namespace TestCraft.Api.Configuration.Hosting;

public static class CorsExtensions
{
    public const string DefaultPolicyName = "Default";

    public static WebApplicationBuilder AddCorsPolicy(
        this WebApplicationBuilder builder,
        CorsOptions corsOptions
    )
    {
        builder.Services.AddCors(options =>
        {
            options.AddPolicy(
                DefaultPolicyName,
                policy =>
                    policy
                        .WithOrigins(corsOptions.CorsAllowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
            );
        });

        return builder;
    }
}
