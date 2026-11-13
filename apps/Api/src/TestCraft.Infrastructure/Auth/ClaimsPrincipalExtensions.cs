using System.Security.Claims;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    extension(ClaimsPrincipal user)
    {
        public string? GetUserIdOrNull() =>
            user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");

        public UserId GetUserId()
        {
            var sub = user.GetUserIdOrNull();
            if (!UserId.TryParse(sub, out var userId))
            {
                throw new DomainException("Token is missing a valid subject claim")
                {
                    ErrorCode = DomainErrorCodes.MissingSubjectClaim,
                };
            }

            return userId;
        }

        public string? GetUserName() =>
            user.FindFirstValue("name")
            ?? user.FindFirstValue(ClaimTypes.Name)
            ?? user.FindFirstValue("preferred_username");

        public string? GetPrincipalKey()
        {
            if (user.GetUserIdOrNull() is not { } userId)
            {
                return null;
            }

            return user.FindFirstValue(ApiTokenAuthenticationDefaults.TokenIdClaim) is { } tokenId
                ? $"token:{tokenId}"
                : $"user:{userId}";
        }

        public bool IsApiToken() =>
            user.Identity?.AuthenticationType
            == ApiTokenAuthenticationDefaults.AuthenticationScheme;
    }
}
