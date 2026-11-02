using Serilog.Core;
using Serilog.Events;

namespace TestCraft.Api.Configuration.Observability;

public sealed class RemovePropertiesEnricher(IReadOnlyList<string> propertyNames)
    : ILogEventEnricher
{
    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        foreach (var name in propertyNames)
        {
            logEvent.RemovePropertyIfPresent(name);
        }
    }
}
