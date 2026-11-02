using System.ComponentModel.DataAnnotations;
using System.Net;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.Proxy;

public sealed class ProxyOptions : IStartupOptions, IValidatableObject
{
    [NotSensitive]
    [ConfigurationKeyName("KNOWN_PROXY_NETWORKS")]
    public string KnownProxyNetworks { get; set; } = string.Empty;

    [NotSensitive]
    public IReadOnlyList<IPNetwork> Networks =>
        [
            .. Entries
                .Select(entry =>
                    IPNetwork.TryParse(entry, out var network) ? network : (IPNetwork?)null
                )
                .OfType<IPNetwork>(),
        ];

    private string[] Entries =>
        KnownProxyNetworks.Split(
            ',',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
        );

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        foreach (var entry in Entries.Where(entry => !IPNetwork.TryParse(entry, out _)))
        {
            yield return new ValidationResult(
                $"'{entry}' is not a CIDR network",
                [nameof(KnownProxyNetworks)]
            );
        }
    }
}
