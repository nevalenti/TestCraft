using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace TestCraft.Common.Hosting;

public static class StrictHostingExtensions
{
    public static WebApplicationBuilder UseStrictHosting(
        this WebApplicationBuilder builder
    )
    {
        builder.Host.UseDefaultServiceProvider(options =>
        {
            options.ValidateOnBuild = true;
            options.ValidateScopes = true;
        });
        builder.WebHost.ConfigureKestrel(options =>
            options.AddServerHeader = false
        );
        return builder;
    }
}
