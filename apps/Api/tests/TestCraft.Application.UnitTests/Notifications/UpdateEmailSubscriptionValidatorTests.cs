using FluentValidation.TestHelper;
using TestCraft.Application.Notifications;

namespace TestCraft.Application.UnitTests.Notifications;

public class UpdateEmailSubscriptionValidatorTests
{
    private readonly UpdateEmailSubscription.Validator _validator = new();

    private static UpdateEmailSubscription.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Email = "notify@example.com",
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
    [InlineData("not-an-email")]
    public void InvalidEmail_FailsValidation(string email)
    {
        var result = _validator.TestValidate(ValidCommand() with { Email = email });
        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void EmptyEvents_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Events = [] });
        result.ShouldHaveValidationErrorFor(x => x.Events);
    }
}
