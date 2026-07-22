using FluentValidation.TestHelper;
using TestCraft.Application.Notifications;

namespace TestCraft.Application.UnitTests.Notifications;

public class CreateWebhookSubscriptionValidatorTests
{
    private readonly CreateWebhookSubscription.Validator _validator = new();

    private static CreateWebhookSubscription.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Url = "https://example.com/webhook",
            Events = ["run.completed"],
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
    [InlineData("ftp://example.com/webhook")]
    public void NonHttpUrl_FailsValidation(string url)
    {
        var result = _validator.TestValidate(ValidCommand() with { Url = url });
        result.ShouldHaveValidationErrorFor(command => command.Url);
    }

    [Fact]
    public void UrlExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Url = "https://example.com/" + new string('a', 2000),
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
    public void NullSecret_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Secret = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Secret);
    }

    [Fact]
    public void EmptyEvents_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Events = [] });
        result.ShouldHaveValidationErrorFor(command => command.Events);
    }
}
