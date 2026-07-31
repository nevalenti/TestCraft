using FluentValidation.TestHelper;
using TestCraft.Application.Features.Notifications;

namespace TestCraft.Application.UnitTests.Notifications;

public class UpdateWebhookSubscriptionValidatorTests
{
    private readonly UpdateWebhookSubscription.Validator _validator = new();

    private static UpdateWebhookSubscription.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Url = "https://example.com/webhook",
            Events = ["run.completed"],
            IsActive = true,
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("not-a-url")]
    public void EmptyOrRelativeUrl_FailsValidation(string url)
    {
        var result = _validator.TestValidate(ValidCommand() with { Url = url });
        result.ShouldHaveValidationErrorFor(command => command.Url);
    }

    [Fact]
    public void NonHttpAbsoluteUrl_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Url = "ftp://example.com/webhook",
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Url);
    }

    [Fact]
    public void SecretExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Secret = new string('a', 201) });
        result.ShouldHaveValidationErrorFor(command => command.Secret);
    }

    [Fact]
    public void EmptyEvents_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Events = [] });
        result.ShouldHaveValidationErrorFor(command => command.Events);
    }
}
