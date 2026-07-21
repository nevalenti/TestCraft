using System.Security.Claims;

namespace TestCraft.Api.Extensions;

internal static class ClaimsPrincipalLogExtensions
{
    public static string? GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

    public static string? GetUsername(this ClaimsPrincipal user) =>
        user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Name);
}
