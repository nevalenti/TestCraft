using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestCaseSteps;

namespace TestCraft.Application.UnitTests.TestCaseSteps;

public class CreateTestCaseStepValidatorTests
{
    private readonly CreateTestCaseStep.Validator _validator = new();

    private static CreateTestCaseStep.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            CaseId = TestCaseId.New(),
            Order = 1,
            Action = "Click submit",
            ExpectedResult = "Form is submitted",
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void OrderZero_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Order = 0 });
        result.ShouldHaveValidationErrorFor(command => command.Order);
    }

    [Fact]
    public void OrderOne_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Order = 1 });
        result.ShouldNotHaveValidationErrorFor(command => command.Order);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceAction_FailsValidation(string action)
    {
        var result = _validator.TestValidate(ValidCommand() with { Action = action });
        result.ShouldHaveValidationErrorFor(command => command.Action);
    }

    [Fact]
    public void ActionExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Action = new string('a', 2001),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Action);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceExpectedResult_FailsValidation(string expectedResult)
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                ExpectedResult = expectedResult,
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.ExpectedResult);
    }

    [Fact]
    public void ExpectedResultExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                ExpectedResult = new string('a', 2001),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.ExpectedResult);
    }
}
