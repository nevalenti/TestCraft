using FluentAssertions;

using TestCraft.Domain.Entities;

namespace TestCraft.Domain.UnitTests.Entities;

public class UserProfileTests
{
    [Fact]
    public void Create_SetsUserIdAndAvatarKey()
    {
        var userId = UserId.New();

        var profile = UserProfile.Create(userId, "avatars/key.png");

        profile.UserId.Should().Be(userId);
        profile.AvatarKey.Should().Be("avatars/key.png");
    }

    [Fact]
    public void Create_WithoutAvatarKey_LeavesItNull()
    {
        var profile = UserProfile.Create(UserId.New());

        profile.AvatarKey.Should().BeNull();
    }

    [Fact]
    public void SetAvatarKey_UpdatesAvatarKey()
    {
        var profile = UserProfile.Create(UserId.New());

        profile.SetAvatarKey("avatars/new-key.png");

        profile.AvatarKey.Should().Be("avatars/new-key.png");
    }
}
