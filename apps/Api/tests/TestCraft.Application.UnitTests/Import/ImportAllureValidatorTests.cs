using FluentValidation.TestHelper;
using TestCraft.Application.Features.Import;

namespace TestCraft.Application.UnitTests.Import;

public class ImportAllureValidatorTests
{
    private readonly ImportAllure.Validator _validator = new();

    private static AllureResultItem PassingResult() =>
        new() { Name = "case", Status = AllureStatus.Passed };

    private static ImportAllure.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            Results = [PassingResult()],
            Environment = "ci",
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptyResults_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Results = [] });
        result.ShouldHaveValidationErrorFor(command => command.Results);
    }

    [Fact]
    public void TooManyResults_FailsValidation()
    {
        var results = Enumerable.Range(0, 10_001).Select(_ => PassingResult()).ToList();
        var result = _validator.TestValidate(ValidCommand() with { Results = results });
        result.ShouldHaveValidationErrorFor(command => command.Results);
    }

    [Fact]
    public void MaxAllowedResults_PassesValidation()
    {
        var results = Enumerable.Range(0, 10_000).Select(_ => PassingResult()).ToList();
        var result = _validator.TestValidate(ValidCommand() with { Results = results });
        result.ShouldNotHaveValidationErrorFor(command => command.Results);
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
    public void UnrecognizedResultStatus_FailsValidation()
    {
        var command = ValidCommand() with
        {
            Results = [new AllureResultItem { Name = "case", Status = (AllureStatus)99 }],
        };

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Results[0].Status");
    }

    [Fact]
    public void NullResultStatus_PassesValidation()
    {
        var command = ValidCommand() with
        {
            Results = [new AllureResultItem { Name = "case", Status = null }],
        };

        var result = _validator.TestValidate(command);
        result.ShouldNotHaveValidationErrorFor("Results[0].Status");
    }

    [Fact]
    public void StatusDetailsMessageExceedingMaxLength_FailsValidation()
    {
        var command = ValidCommand() with
        {
            Results =
            [
                new AllureResultItem
                {
                    Name = "case",
                    Status = AllureStatus.Failed,
                    StatusDetails = new AllureStatusDetails { Message = new string('a', 5001) },
                },
            ],
        };

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Results[0].StatusDetails.Message");
    }
}
