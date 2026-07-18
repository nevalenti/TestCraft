using DotNetEnv;
using TestCraft.Api.Configuration;
using TestCraft.Infrastructure.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.Logger.LogStartupConfiguration(
    app.Services.GetRequiredService<ApiOptions>(),
    app.Services.GetRequiredService<InfrastructureOptions>()
);

await app.MigrateDatabaseAsync();

app.ConfigureApplication();

await app.RunAsync();
