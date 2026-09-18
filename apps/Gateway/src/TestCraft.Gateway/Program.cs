using DotNetEnv;

using TestCraft.Gateway.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.Logger.LogStartupConfiguration(app.Configuration);

app.ConfigurePipeline();

await app.RunAsync();
