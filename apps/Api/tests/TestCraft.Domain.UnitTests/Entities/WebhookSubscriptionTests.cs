using FluentAssertions;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class WebhookSubscriptionTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Create_WithEmptyUrl_ThrowsDomainException()
    {
        var act = () =>
            WebhookSubscription.Create(ProjectId.New(), "", null, "[\"run.completed\"]", Now);

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void Create_IsActiveByDefault()
    {
        var subscription = WebhookSubscription.Create(
            ProjectId.New(),
            "https://example.com/hook",
            null,
            "[\"run.completed\"]",
            Now
        );

        subscription.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Update_WithEmptyUrl_ThrowsDomainException()
    {
        var subscription = WebhookSubscription.Create(
            ProjectId.New(),
            "https://example.com/hook",
            null,
            "[\"run.completed\"]",
            Now
        );

        var act = () => subscription.Update("", null, "[\"run.completed\"]", true);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void Update_SetsFields()
    {
        var subscription = WebhookSubscription.Create(
            ProjectId.New(),
            "https://example.com/hook",
            null,
            "[\"run.completed\"]",
            Now
        );

        subscription.Update("https://example.com/updated", "secret", "[\"run.failed\"]", false);

        subscription.Url.Should().Be("https://example.com/updated");
        subscription.Secret.Should().Be("secret");
        subscription.Events.Should().Be("[\"run.failed\"]");
        subscription.IsActive.Should().BeFalse();
    }
}
