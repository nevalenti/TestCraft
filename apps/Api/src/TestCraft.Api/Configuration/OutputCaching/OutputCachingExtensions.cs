using Microsoft.AspNetCore.OutputCaching;

namespace TestCraft.Api.Configuration.OutputCaching;

public static class OutputCachingExtensions
{
    public const string PublicSharePolicy = "PublicShare";

    private const string PublicShareTag = "public-share";

    public static WebApplicationBuilder AddOutputCaching(this WebApplicationBuilder builder)
    {
        builder.Services.AddOutputCache(options =>
            options.AddPolicy(
                PublicSharePolicy,
                policy =>
                    policy
                        .Expire(TimeSpan.FromSeconds(15))
                        .SetVaryByRouteValue("token")
                        .SetVaryByQuery("page", "page_size")
                        .Tag(PublicShareTag)
            )
        );

        return builder;
    }

    /// <summary>Drops cached public share views, so a revoked or deleted run stops showing at once.</summary>
    public static ValueTask EvictPublicSharesAsync(
        this IOutputCacheStore store,
        CancellationToken cancellationToken
    ) => store.EvictByTagAsync(PublicShareTag, cancellationToken);
}
