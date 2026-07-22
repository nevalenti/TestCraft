using FluentValidation.TestHelper;
using TestCraft.Application.Notifications;

namespace TestCraft.Application.UnitTests.Notifications;

public class CreateEmailSubscriptionValidatorTests
{
    private readonly CreateEmailSubscription.Validator _validator = new();

    private static CreateEmailSubscription.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Email = "notify@example.com",
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
    [InlineData("not-an-email")]
    public void InvalidEmail_FailsValidation(string email)
    {
        var result = _validator.TestValidate(ValidCommand() with { Email = email });
        result.ShouldHaveValidationErrorFor(command => command.Email);
    }

    [Fact]
    public void EmptyEvents_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Events = [] });
        result.ShouldHaveValidationErrorFor(command => command.Events);
    }
}
