using FluentValidation.TestHelper;
using TestCraft.Application.TestCaseSteps;

namespace TestCraft.Application.UnitTests.TestCaseSteps;

public class UpdateTestCaseStepValidatorTests
{
    private readonly UpdateTestCaseStep.Validator _validator = new();

    private static UpdateTestCaseStep.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            CaseId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
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
        result.ShouldHaveValidationErrorFor(x => x.Order);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceAction_FailsValidation(string action)
    {
        var result = _validator.TestValidate(ValidCommand() with { Action = action });
        result.ShouldHaveValidationErrorFor(x => x.Action);
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
        result.ShouldHaveValidationErrorFor(x => x.ExpectedResult);
    }
}
