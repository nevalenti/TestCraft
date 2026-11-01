using Microsoft.AspNetCore.Http;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Auth;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public UserId UserId =>
        httpContextAccessor.HttpContext?.User is { Identity.IsAuthenticated: true } user
            ? user.GetUserId()
            : throw new UnauthorizedException("No authenticated user in the current context");

    public string? UserName => httpContextAccessor.HttpContext?.User.GetUserName();
}
