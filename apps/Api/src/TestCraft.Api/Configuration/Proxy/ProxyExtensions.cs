using Microsoft.AspNetCore.HttpOverrides;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Proxy;

public static class ProxyExtensions
{
    public static WebApplicationBuilder AddTrustedProxies(this WebApplicationBuilder builder)
    {
        var proxyOptions = builder.Services.AddStartupOptions<ProxyOptions>(builder.Configuration);
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
            foreach (var network in proxyOptions.Networks)
            {
                options.KnownIPNetworks.Add(network);
            }
        });

        return builder;
    }
}
