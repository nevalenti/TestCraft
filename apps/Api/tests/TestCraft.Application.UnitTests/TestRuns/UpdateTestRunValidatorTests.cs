using FluentValidation.TestHelper;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestRuns;

public class UpdateTestRunValidatorTests
{
    private readonly UpdateTestRun.Validator _validator = new();

    private static UpdateTestRun.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Name = "Nightly Run",
            Environment = "staging",
            Status = TestRunStatus.Active,
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
    [InlineData(" ")]
    public void EmptyOrWhitespaceEnvironment_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(ValidCommand() with { Environment = environment });
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void OutOfRangeStatus_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Status = (TestRunStatus)999 });
        result.ShouldHaveValidationErrorFor(x => x.Status);
    }
}
