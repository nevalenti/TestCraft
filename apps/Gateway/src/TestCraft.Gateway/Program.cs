using Prometheus;

using TestCraft.Common.Http;
using TestCraft.Gateway.Configuration;
using TestCraft.Gateway.Middleware;

var builder = WebApplication.CreateBuilder(args);

var gatewayLoggingOptions = GatewayLoggingOptions.Bind(builder.Configuration);
builder.AddSerilogLogging(gatewayLoggingOptions);
builder.AddOpenTelemetryTracing(gatewayLoggingOptions);

builder
    .Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

var seqBasicAuthOptions = SeqBasicAuthOptions.Bind(builder.Configuration);
var gatewayMetricsOptions = GatewayMetricsOptions.Bind(builder.Configuration);

app.Logger.LogStartupConfiguration(builder.Configuration);

app.UseRequestId();
app.UseRequestLogging();
app.UseHttpsRedirectionWithAcmeExemption();
app.UseLegacyPathRedirects();
app.UseDotPathGuard();
app.UseSeqBasicAuth(seqBasicAuthOptions);
app.UseHttpMetrics();

app.MapGatewayMetrics(gatewayMetricsOptions);
app.MapReverseProxy();

await app.RunAsync();
