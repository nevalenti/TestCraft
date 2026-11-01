using System.Globalization;
using System.Security.Claims;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Infrastructure.Auth;

namespace TestCraft.Api.Realtime;

internal static class SignedInSession
{
    public static DateTimeOffset ExpiresAt(ClaimsPrincipal user)
    {
        if (user.IsApiToken())
        {
            throw new ForbiddenException("This action requires a signed-in user, not an API token");
        }

        var exp = user.FindFirstValue("exp");
        if (
            !long.TryParse(exp, NumberStyles.Integer, CultureInfo.InvariantCulture, out var seconds)
        )
        {
            throw new UnauthorizedException("A signed-in session is required for live updates");
        }

        return DateTimeOffset.FromUnixTimeSeconds(seconds);
    }
}
