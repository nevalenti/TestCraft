using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestResults;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestResults;

public class UpdateTestResultValidatorTests
{
    private readonly UpdateTestResult.Validator _validator = new();

    private static UpdateTestResult.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            RunId = TestRunId.New(),
            Id = TestResultId.New(),
            Status = TestResultStatus.Failed,
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
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
    public void NullDefectType_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { DefectType = null });
        result.ShouldNotHaveValidationErrorFor(command => command.DefectType);
    }
}
