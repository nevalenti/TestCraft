using System.Security.Claims;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            throw new DomainException("Token is missing a valid subject claim");
        }

        return userId;
    }
}
