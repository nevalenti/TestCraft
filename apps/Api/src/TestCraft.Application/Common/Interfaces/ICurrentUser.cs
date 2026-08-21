namespace TestCraft.Application.Common.Interfaces;

public interface ICurrentUser
{
    UserId UserId { get; }
    string? UserName { get; }
}
