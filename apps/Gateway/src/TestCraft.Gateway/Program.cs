var builder = WebApplication.CreateBuilder(args);

builder
    .Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.Use(
    async (context, next) =>
    {
        var path = context.Request.Path.Value ?? string.Empty;
        var isAcmeChallenge = path.StartsWith(
            "/.well-known/acme-challenge",
            StringComparison.Ordinal
        );

        if (!context.Request.IsHttps && !isAcmeChallenge)
        {
            context.Response.StatusCode =
                StatusCodes.Status307TemporaryRedirect;
            context.Response.Headers.Location =
                $"https://{context.Request.Host.Host}{context.Request.Path}{context.Request.QueryString}";
            return;
        }

        string? redirect = path switch
        {
            "/keycloak" => "https://auth.testcraft.pro/",
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

        var isDotPath = path.StartsWith("/.", StringComparison.Ordinal);
        var isWellKnown = path.StartsWith(
            "/.well-known",
            StringComparison.Ordinal
        );
        if (isDotPath && !isWellKnown)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }

        await next();
    }
);

app.MapReverseProxy();

await app.RunAsync();
