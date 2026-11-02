namespace TestCraft.Api.Realtime;

public static class RealtimeEndpoints
{
    public static WebApplication MapRealtime(this WebApplication app)
    {
        app.Map(
                "/ws/runs/{runId:guid}",
                (HttpContext context, Guid runId, RealtimeSocketServer server) =>
                    server.ServeRunAsync(context, TestRunId.From(runId))
            )
            .AllowAnonymous()
            .ExcludeFromDescription();
        app.Map(
                "/ws/dashboard",
                (HttpContext context, RealtimeSocketServer server) =>
                    server.ServeDashboardAsync(context)
            )
            .AllowAnonymous()
            .ExcludeFromDescription();

        return app;
    }
}
