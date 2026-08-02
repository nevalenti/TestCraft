using DotNetEnv;
using Microsoft.Extensions.DependencyInjection;
using TestCraft.Api.Configuration.Database;
using TestCraft.Api.Configuration.Hosting;
using TestCraft.Infrastructure.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

app.Logger.LogStartupConfiguration(app.Services);
app.Logger.LogInfrastructureFallbacks(app.Services.GetRequiredService<InfrastructureOptions>());

await app.MigrateDatabaseAsync();

app.ConfigureApplication();

await app.RunAsync();
