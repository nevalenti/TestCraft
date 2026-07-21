using Microsoft.AspNetCore.OutputCaching;

namespace TestCraft.Api.Configuration;

public static class OutputCachingExtensions
{
    public const string PublicSharePolicy = "PublicShare";

    public static WebApplicationBuilder AddOutputCaching(this WebApplicationBuilder builder)
    {
        builder.Services.AddOutputCache(options =>
            options.AddPolicy(
                PublicSharePolicy,
                policy => policy.Expire(TimeSpan.FromSeconds(15)).SetVaryByRouteValue("token")
            )
        );

        return builder;
    }
}
