using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestSuites;

namespace TestCraft.Application.UnitTests.TestSuites;

public class CreateTestSuiteValidatorTests
{
    private readonly CreateTestSuite.Validator _validator = new();

    private static CreateTestSuite.Command ValidCommand() =>
        new() { ProjectId = ProjectId.New(), Name = "Regression Suite" };

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
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 256) });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NameAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 255) });
        result.ShouldNotHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void DescriptionExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Description = new string('a', 2001),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Description);
    }

    [Fact]
    public void NullDescription_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Description = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Description);
    }
}
