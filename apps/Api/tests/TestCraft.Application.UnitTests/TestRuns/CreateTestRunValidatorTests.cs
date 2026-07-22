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
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Fact]
    public void NameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 256) });
        result.ShouldHaveValidationErrorFor(command => command.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceEnvironment_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(ValidCommand() with { Environment = environment });
        result.ShouldHaveValidationErrorFor(command => command.Environment);
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
        result.ShouldHaveValidationErrorFor(command => command.Environment);
    }

    [Fact]
    public void NullSource_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Source);
    }

    [Fact]
    public void EmptySource_FailsValidationOnlyWhenProvided()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = "" });
        result.ShouldHaveValidationErrorFor(command => command.Source);
    }

    [Fact]
    public void SourceExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Source = new string('a', 101) });
        result.ShouldHaveValidationErrorFor(command => command.Source);
    }
}
