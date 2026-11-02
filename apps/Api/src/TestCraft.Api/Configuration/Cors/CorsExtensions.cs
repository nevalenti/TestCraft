using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Cors;

public static class CorsExtensions
{
    public const string DefaultPolicyName = "Default";

    public static WebApplicationBuilder AddCorsPolicy(this WebApplicationBuilder builder)
    {
        var corsOptions = builder.Services.AddStartupOptions<CorsOptions>(builder.Configuration);
        builder.Services.AddCors(options =>
        {
            options.AddPolicy(
                DefaultPolicyName,
                policy =>
                    policy
                        .WithOrigins(corsOptions.AllowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials()
            );
        });

        return builder;
    }
}
