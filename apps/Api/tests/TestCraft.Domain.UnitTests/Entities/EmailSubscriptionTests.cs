using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class EmailSubscriptionTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_WithEmptyEmail_ThrowsDomainException()
    {
        var act = () => EmailSubscription.Create(ProjectId.New(), "", "[\"run.completed\"]", Now);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_IsActiveByDefault()
    {
        var subscription = EmailSubscription.Create(
            ProjectId.New(),
            "team@example.com",
            "[\"run.completed\"]",
            Now
        );

        subscription.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Update_WithEmptyEmail_ThrowsDomainException()
    {
        var subscription = EmailSubscription.Create(
            ProjectId.New(),
            "team@example.com",
            "[\"run.completed\"]",
            Now
        );

        var act = () => subscription.Update("", "[\"run.completed\"]", true);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Update_SetsFields()
    {
        var subscription = EmailSubscription.Create(
            ProjectId.New(),
            "team@example.com",
            "[\"run.completed\"]",
            Now
        );

        subscription.Update("other@example.com", "[\"run.failed\"]", false);

        subscription.Email.Should().Be("other@example.com");
        subscription.Events.Should().Be("[\"run.failed\"]");
        subscription.IsActive.Should().BeFalse();
    }
}
