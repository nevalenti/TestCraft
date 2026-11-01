using System.ComponentModel.DataAnnotations;
using TestCraft.Infrastructure.Configuration;

namespace TestCraft.Api.Configuration.RateLimiting;

public sealed class RateLimitOptions : IStartupOptions
{
    [NotSensitive]
    [Range(1, int.MaxValue)]
    [ConfigurationKeyName("RATE_LIMIT_PER_PRINCIPAL")]
    public int PerPrincipal { get; set; } = 10_000;

    [NotSensitive]
    [Range(1, int.MaxValue)]
    [ConfigurationKeyName("RATE_LIMIT_PER_IP")]
    public int PerIp { get; set; } = 30_000;

    [NotSensitive]
    [Range(1, int.MaxValue)]
    [ConfigurationKeyName("RATE_LIMIT_SHARE_PER_IP")]
    public int SharePerIp { get; set; } = 300;

    [NotSensitive]
    [Range(1, int.MaxValue)]
    [ConfigurationKeyName("RATE_LIMIT_MEMBER_INVITES_PER_PRINCIPAL")]
    public int MemberInvitesPerPrincipal { get; set; } = 100;
}
