using FluentValidation.TestHelper;
using TestCraft.Application.Labels;

namespace TestCraft.Application.UnitTests.Labels;

public class UpdateLabelValidatorTests
{
    private readonly UpdateLabel.Validator _validator = new();

    private static UpdateLabel.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
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
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("FF00AA")]
    [InlineData("#FF00AZ")]
    public void InvalidColor_FailsValidation(string color)
    {
        var result = _validator.TestValidate(ValidCommand() with { Color = color });
        result.ShouldHaveValidationErrorFor(x => x.Color);
    }
}
