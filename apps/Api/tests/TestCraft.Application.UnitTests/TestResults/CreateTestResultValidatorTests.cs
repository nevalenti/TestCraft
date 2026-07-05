using FluentValidation.TestHelper;
using TestCraft.Application.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestResults;

public class CreateTestResultValidatorTests
{
    private readonly CreateTestResult.Validator _validator = new();

    private static CreateTestResult.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            TestCaseId = Guid.NewGuid(),
            Status = TestResultStatus.Passed,
            ExecutedAt = DateTimeOffset.UtcNow,
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyTestCaseId_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { TestCaseId = Guid.Empty });
        result.ShouldHaveValidationErrorFor(x => x.TestCaseId);
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
        result.ShouldHaveValidationErrorFor(x => x.Status);
    }

    [Fact]
    public void NotesExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = new string('a', 5001) });
        result.ShouldHaveValidationErrorFor(x => x.Notes);
    }

    [Fact]
    public void NotesAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = new string('a', 5000) });
        result.ShouldNotHaveValidationErrorFor(x => x.Notes);
    }

    [Fact]
    public void NullNotes_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = null });
        result.ShouldNotHaveValidationErrorFor(x => x.Notes);
    }
}
