using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestResults;

public class CreateTestResultByNameValidatorTests
{
    private readonly CreateTestResultByName.Validator _validator = new();

    private static CreateTestResultByName.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            SuiteName = "Checkout",
            TestCaseName = "Applies discount code",
            Status = TestResultStatus.Passed,
            ExecutedAt = DateTimeOffset.UtcNow,
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
    public void EmptyOrWhitespaceSuiteName_FailsValidation(string suiteName)
    {
        var result = _validator.TestValidate(ValidCommand() with { SuiteName = suiteName });
        result.ShouldHaveValidationErrorFor(command => command.SuiteName);
    }

    [Fact]
    public void SuiteNameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                SuiteName = new string('a', 501),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.SuiteName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceTestCaseName_FailsValidation(string testCaseName)
    {
        var result = _validator.TestValidate(ValidCommand() with { TestCaseName = testCaseName });
        result.ShouldHaveValidationErrorFor(command => command.TestCaseName);
    }

    [Fact]
    public void TestCaseNameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                TestCaseName = new string('a', 501),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.TestCaseName);
    }

    [Fact]
    public void OutOfRangeStatus_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Status = (TestResultStatus)999,
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Status);
    }

    [Fact]
    public void NotesExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = new string('a', 5001) });
        result.ShouldHaveValidationErrorFor(command => command.Notes);
    }
}
