using Serilog.Core;
using Serilog.Events;

namespace TestCraft.Api.Configuration;

public class PinoLevelEnricher : ILogEventEnricher
{
    public void Enrich(
        LogEvent logEvent,
        ILogEventPropertyFactory propertyFactory
    )
    {
        var level = logEvent.Level switch
        {
            LogEventLevel.Verbose => "trace",
            LogEventLevel.Debug => "debug",
            LogEventLevel.Information => "info",
            LogEventLevel.Warning => "warn",
            LogEventLevel.Error => "error",
            LogEventLevel.Fatal => "fatal",
            _ => "info",
        };

        logEvent.AddPropertyIfAbsent(
            propertyFactory.CreateProperty("level", level)
        );
    }
}
