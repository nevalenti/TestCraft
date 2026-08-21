using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.UnitTests.Common.Fakes;

internal sealed class FakeCurrentUser : ICurrentUser
{
    public UserId UserId { get; init; } = UserId.New();
    public string? UserName { get; init; } = "test-user";
}
