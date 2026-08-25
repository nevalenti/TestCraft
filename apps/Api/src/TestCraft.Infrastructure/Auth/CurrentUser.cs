using Microsoft.AspNetCore.Http;

using TestCraft.Application.Common.Interfaces;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Infrastructure.Auth;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public UserId UserId =>
        httpContextAccessor.HttpContext?.User.GetUserId()
        ?? throw new DomainException("No authenticated user in the current context")
        {
            ErrorCode = DomainErrorCodes.UserNotAuthenticated,
        };

    public string? UserName => httpContextAccessor.HttpContext?.User.GetUserName();
}
