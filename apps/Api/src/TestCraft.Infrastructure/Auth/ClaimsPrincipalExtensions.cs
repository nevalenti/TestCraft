using System.Security.Claims;

using TestCraft.Domain.Exceptions;

namespace TestCraft.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserIdOrNull(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

    public static UserId GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.GetUserIdOrNull();
        if (!UserId.TryParse(sub, out var userId))
        {
            throw new DomainException("Token is missing a valid subject claim");
        }

        return userId;
    }

    public static string? GetUserName(this ClaimsPrincipal user) =>
        user.FindFirstValue("name")
        ?? user.FindFirstValue(ClaimTypes.Name)
        ?? user.FindFirstValue("preferred_username");
}
