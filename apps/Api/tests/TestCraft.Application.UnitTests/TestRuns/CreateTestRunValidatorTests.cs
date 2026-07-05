using FluentValidation.TestHelper;
using TestCraft.Application.TestRuns;

namespace TestCraft.Application.UnitTests.TestRuns;

public class CreateTestRunValidatorTests
{
    private readonly CreateTestRun.Validator _validator = new();

    private static CreateTestRun.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Name = "Nightly Run",
            Environment = "staging",
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

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceEnvironment_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(ValidCommand() with { Environment = environment });
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void EnvironmentExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Environment = new string('a', 256),
            }
        );
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void NullSource_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = null });
        result.ShouldNotHaveValidationErrorFor(x => x.Source);
    }

    [Fact]
    public void EmptySource_FailsValidationOnlyWhenProvided()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = "" });
        result.ShouldHaveValidationErrorFor(x => x.Source);
    }

    [Fact]
    public void SourceExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = new string('a', 101) });
        result.ShouldHaveValidationErrorFor(x => x.Source);
    }
}
