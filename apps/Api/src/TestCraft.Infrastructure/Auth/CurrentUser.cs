using Microsoft.AspNetCore.Http;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Infrastructure.Auth;

public class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    public Guid UserId =>
        httpContextAccessor.HttpContext?.User.GetUserId()
        ?? throw new DomainException("No authenticated user in the current context");
}
