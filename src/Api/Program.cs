using Api.Configuration;

using DotNetEnv;

using Serilog;

Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

builder.AddSerilog();

try
{
    builder.Services.ConfigureServices(builder.Configuration);

    var app = builder.Build();

    await app.ConfigurePipeline();

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