using System.Security.Claims;
using System.Text.Encodings.Web;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.ValueObjects;

namespace TestCraft.Infrastructure.Auth;

public static class ApiTokenAuthenticationDefaults
{
    public const string AuthenticationScheme = "ApiToken";
}

public class ApiTokenAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IApplicationDbContext dbContext,
    IApiTokenHasher hasher
) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
            return AuthenticateResult.NoResult();

        var value = authHeader.ToString();
        if (!value.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var rawToken = value["Bearer ".Length..];
        if (string.IsNullOrWhiteSpace(rawToken))
            return AuthenticateResult.NoResult();

        var tokenHash = hasher.Hash(rawToken);
        var apiToken = await dbContext
            .ApiTokens.SingleOrDefaultAsync(t => t.TokenHash == tokenHash, Context.RequestAborted);

        if (apiToken is null || apiToken.IsRevoked)
            return AuthenticateResult.Fail("Invalid or revoked API token");

        if (apiToken.ExpiresAt is { } expiresAt && expiresAt <= DateTimeOffset.UtcNow)
            return AuthenticateResult.Fail("API token has expired");

        var routeProjectId = Context.GetRouteValue("projectId")?.ToString();
        if (
            !ProjectId.TryParse(routeProjectId, out var requestedProjectId)
            || requestedProjectId != apiToken.ProjectId
        )
            return AuthenticateResult.Fail("API token is not valid for this project");

        apiToken.LastUsedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(Context.RequestAborted);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, apiToken.CreatedById.ToString()),
            new Claim("name", apiToken.Name),
        };
        var identity = new ClaimsIdentity(claims, ApiTokenAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(
            principal,
            ApiTokenAuthenticationDefaults.AuthenticationScheme
        );

        return AuthenticateResult.Success(ticket);
    }
}
