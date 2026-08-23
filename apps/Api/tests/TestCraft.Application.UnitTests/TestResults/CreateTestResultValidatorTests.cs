using FluentValidation.TestHelper;

using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestResults;

public class CreateTestResultValidatorTests
{
    private readonly CreateTestResult.Validator _validator = new();

    private static CreateTestResult.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            RunId = TestRunId.New(),
            TestCaseId = TestCaseId.New(),
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
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                TestCaseId = TestCaseId.From(Guid.Empty),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.TestCaseId);
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

    [Fact]
    public void NotesAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = new string('a', 5000) });
        result.ShouldNotHaveValidationErrorFor(command => command.Notes);
    }

    [Fact]
    public void NullNotes_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Notes = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Notes);
    }
}
