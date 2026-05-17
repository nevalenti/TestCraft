using Api.Configuration;

using DotNetEnv;

using Serilog;

if (File.Exists(".env"))
    Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");

    var seqUrl = ctx.Configuration["Seq:ServerUrl"];
    if (!string.IsNullOrEmpty(seqUrl))
        cfg.WriteTo.Seq(seqUrl);
});

try
{
    builder.Services.ConfigureServices(builder.Configuration);

    var app = builder.Build();

    app.ConfigurePipeline();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");

    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}

public partial class Program;