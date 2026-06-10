using DotNetEnv;
using TestCraft.Api.Configuration;

Env.NoClobber().TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

builder.ConfigureServices();

var app = builder.Build();

await app.MigrateDatabaseAsync();

app.ConfigureApplication();

await app.RunAsync();
