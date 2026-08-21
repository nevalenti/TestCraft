using System.Security.Claims;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    public static UserId GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            throw new DomainException("Token is missing a valid subject claim");
        }

        return UserId.From(userId);
    }

    public static string? GetUserName(this ClaimsPrincipal user) =>
        user.FindFirstValue("name")
        ?? user.FindFirstValue(ClaimTypes.Name)
        ?? user.FindFirstValue("preferred_username");
}
