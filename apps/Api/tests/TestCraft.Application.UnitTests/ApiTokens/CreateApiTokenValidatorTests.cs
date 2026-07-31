using FluentValidation.TestHelper;
using TestCraft.Application.Features.ApiTokens;

namespace TestCraft.Application.UnitTests.ApiTokens;

public class CreateApiTokenValidatorTests
{
    private readonly CreateApiToken.Validator _validator = new();

    private static CreateApiToken.Command ValidCommand() =>
        new() { ProjectId = Guid.NewGuid(), Name = "CI token" };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceName_FailsValidation(string name)
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = name });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 101) });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NullExpiresAt_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { ExpiresAt = null });
        result.ShouldNotHaveValidationErrorFor(command => command.ExpiresAt);
    }
}
