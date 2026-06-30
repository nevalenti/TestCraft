namespace TestCraft.Application.Common.Interfaces;

public interface ICurrentUser
{
    Guid UserId { get; }
    string? UserName { get; }
}
