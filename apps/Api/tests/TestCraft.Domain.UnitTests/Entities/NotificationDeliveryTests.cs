using FluentAssertions;

using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Domain.UnitTests.Entities;

public class NotificationDeliveryTests
{
    [Fact]
    public void FromFailedAttempt_WithEmptyTarget_ThrowsDomainException()
    {
        var act = () =>
            NotificationDelivery.FromFailedAttempt(
                ProjectId.New(),
                NotificationChannel.Webhook,
                "run.completed",
                "",
                "{}",
                secret: null,
                "connection refused"
            );

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.RequiredField);
    }

    [Fact]
    public void FromFailedAttempt_SetsAttemptCountToOneAndStatusPending()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Webhook,
            "run.completed",
            "https://example.com/hook",
            "{}",
            "secret",
            "connection refused"
        );

        delivery.AttemptCount.Should().Be(1);
        delivery.Status.Should().Be(NotificationDeliveryStatus.Pending);
        delivery.LastError.Should().Be("connection refused");
        delivery.NextAttemptAt.Should().BeAfter(DateTimeOffset.UtcNow);
    }

    [Fact]
    public void RecordFailedAttempt_IncrementsAttemptCountAndPushesNextAttemptOut()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Webhook,
            "run.completed",
            "https://example.com/hook",
            "{}",
            secret: null,
            "connection refused"
        );
        var firstNextAttempt = delivery.NextAttemptAt;

        delivery.RecordFailedAttempt("timed out");

        delivery.AttemptCount.Should().Be(2);
        delivery.LastError.Should().Be("timed out");
        delivery.Status.Should().Be(NotificationDeliveryStatus.Pending);
        delivery.NextAttemptAt.Should().BeAfter(firstNextAttempt);
    }

    [Fact]
    public void RecordFailedAttempt_AbandonsDeliveryAfterExhaustingBackoffSchedule()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Email,
            "run.completed",
            "user@example.com",
            "{}",
            secret: null,
            "smtp error"
        );

        while (delivery.Status == NotificationDeliveryStatus.Pending)
            delivery.RecordFailedAttempt("smtp error");

        delivery.Status.Should().Be(NotificationDeliveryStatus.Abandoned);
    }

    [Fact]
    public void MarkSent_SetsStatusToSent()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Webhook,
            "run.completed",
            "https://example.com/hook",
            "{}",
            secret: null,
            "connection refused"
        );

        delivery.MarkSent();

        delivery.Status.Should().Be(NotificationDeliveryStatus.Sent);
    }

    [Fact]
    public void MarkSent_OnAbandonedDelivery_ThrowsDomainException()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Email,
            "run.completed",
            "user@example.com",
            "{}",
            secret: null,
            "smtp error"
        );
        while (delivery.Status == NotificationDeliveryStatus.Pending)
            delivery.RecordFailedAttempt("smtp error");

        var act = () => delivery.MarkSent();

        act.Should()
            .Throw<DomainException>()
            .Which.ErrorCode.Should()
            .Be(DomainErrorCodes.InvalidNotificationDeliveryStatusTransition);
    }

    [Fact]
    public void MarkSent_CalledTwice_IsIdempotent()
    {
        // A redelivered success confirmation re-entering the same terminal state is
        // harmless and shouldn't throw - only an actual reversal (e.g. from Abandoned) should.
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Webhook,
            "run.completed",
            "https://example.com/hook",
            "{}",
            secret: null,
            "connection refused"
        );
        delivery.MarkSent();

        var act = () => delivery.MarkSent();

        act.Should().NotThrow();
        delivery.Status.Should().Be(NotificationDeliveryStatus.Sent);
    }

    [Fact]
    public void RecordFailedAttempt_OnSentDelivery_ThrowsDomainException()
    {
        var delivery = NotificationDelivery.FromFailedAttempt(
            ProjectId.New(),
            NotificationChannel.Webhook,
            "run.completed",
            "https://example.com/hook",
            "{}",
            secret: null,
            "connection refused"
        );
        delivery.MarkSent();

        var act = () => delivery.RecordFailedAttempt("late failure");

        act.Should().Throw<DomainException>();
    }
}
