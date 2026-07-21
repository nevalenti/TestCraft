using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.UnitTests.Common.Fakes;

internal sealed class FakeCurrentUser : ICurrentUser
{
    public Guid UserId { get; init; } = Guid.NewGuid();
    public string? UserName { get; init; } = "test-user";
}
