var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpsRedirection(options => options.HttpsPort = 443);
builder
    .Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseHttpsRedirection();

app.Use(
    async (context, next) =>
    {
        var path = context.Request.Path.Value ?? string.Empty;

        string? redirect = path switch
        {
            "/keycloak" => $"https://{context.Request.Host.Host}:8443/",
            "/grafana" => "/grafana/",
            "/seq" => "/seq/",
            "/docs" => "/docs/",
            _ => null,
        };

        if (redirect is not null)
        {
            context.Response.Redirect(redirect, permanent: true);
            return;
        }

        if (
            path.StartsWith("/.", StringComparison.Ordinal)
            && !path.StartsWith("/.well-known", StringComparison.Ordinal)
        )
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        await next();
    }
);

app.MapReverseProxy();

await app.RunAsync();
