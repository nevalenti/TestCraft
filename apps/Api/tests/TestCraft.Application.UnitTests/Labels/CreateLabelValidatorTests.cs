using FluentValidation.TestHelper;
using TestCraft.Application.Features.Labels;

namespace TestCraft.Application.UnitTests.Labels;

public class CreateLabelValidatorTests
{
    private readonly CreateLabel.Validator _validator = new();

    private static CreateLabel.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Name = "Regression",
            Color = "#FF00AA",
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
    public void EmptyOrWhitespaceName_FailsValidation(string name)
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = name });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 51) });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("FF00AA")]
    [InlineData("#FF00AZ")]
    [InlineData("#FF00A")]
    [InlineData("red")]
    public void InvalidColor_FailsValidation(string color)
    {
        var result = _validator.TestValidate(ValidCommand() with { Color = color });
        result.ShouldHaveValidationErrorFor(command => command.Color);
    }

    [Theory]
    [InlineData("#000000")]
    [InlineData("#ffffff")]
    [InlineData("#1a2B3c")]
    public void ValidHexColor_PassesValidation(string color)
    {
        var result = _validator.TestValidate(ValidCommand() with { Color = color });
        result.ShouldNotHaveValidationErrorFor(command => command.Color);
    }
}
