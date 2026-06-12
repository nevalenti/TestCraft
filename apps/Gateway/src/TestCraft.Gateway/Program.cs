var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpsRedirection(options => options.HttpsPort = 443);
builder
    .Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseHttpsRedirection();

app.Use(
    (context, next) =>
    {
        var path = context.Request.Path.Value ?? string.Empty;

        switch (path)
        {
            case "/keycloak":
                var host = context.Request.Host.Host;
                context.Response.Redirect(
                    $"https://{host}:8443/",
                    permanent: true
                );
                return Task.CompletedTask;
            case "/grafana":
                context.Response.Redirect("/grafana/", permanent: true);
                return Task.CompletedTask;
            case "/seq":
                context.Response.Redirect("/seq/", permanent: true);
                return Task.CompletedTask;
        }

        var isHidden =
            path.StartsWith("/.", StringComparison.Ordinal)
            && !path.StartsWith("/.well-known", StringComparison.Ordinal);

        if (isHidden)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        return next(context);
    }
);

app.MapReverseProxy();

await app.RunAsync();
