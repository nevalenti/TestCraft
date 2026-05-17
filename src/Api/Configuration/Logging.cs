using Serilog;

namespace Api.Configuration;

public static class Logging
{
    public static WebApplicationBuilder AddSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((ctx, cfg) =>
        {
            cfg.ReadFrom.Configuration(ctx.Configuration)
               .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");

            var seqUrl = ctx.Configuration["Seq:ServerUrl"];
            if (!string.IsNullOrEmpty(seqUrl))
                cfg.WriteTo.Seq(seqUrl);
        });

        return builder;
    }
}