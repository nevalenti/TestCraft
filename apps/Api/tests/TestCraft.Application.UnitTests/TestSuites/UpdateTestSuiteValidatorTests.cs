using FluentValidation.TestHelper;
using TestCraft.Application.TestSuites;

namespace TestCraft.Application.UnitTests.TestSuites;

public class UpdateTestSuiteValidatorTests
{
    private readonly UpdateTestSuite.Validator _validator = new();

    private static UpdateTestSuite.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Name = "Regression Suite",
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

    [Fact]
    public void NameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 256) });
        result.ShouldHaveValidationErrorFor(x => x.Name);
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
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void NullDescription_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Description = null });
        result.ShouldNotHaveValidationErrorFor(x => x.Description);
    }
}
