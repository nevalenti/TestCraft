using FluentValidation.TestHelper;
using TestCraft.Application.Import;

namespace TestCraft.Application.UnitTests.Import;

public class ImportAllureValidatorTests
{
    private readonly ImportAllure.Validator _validator = new();

    private static AllureResultItem PassingResult() => new() { Name = "case", Status = "passed" };

    private static ImportAllure.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
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
        result.ShouldHaveValidationErrorFor(x => x.Results);
    }

    [Fact]
    public void TooManyResults_FailsValidation()
    {
        var results = Enumerable.Range(0, 10_001).Select(_ => PassingResult()).ToList();
        var result = _validator.TestValidate(ValidCommand() with { Results = results });
        result.ShouldHaveValidationErrorFor(x => x.Results);
    }

    [Fact]
    public void MaxAllowedResults_PassesValidation()
    {
        var results = Enumerable.Range(0, 10_000).Select(_ => PassingResult()).ToList();
        var result = _validator.TestValidate(ValidCommand() with { Results = results });
        result.ShouldNotHaveValidationErrorFor(x => x.Results);
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
    public void UnrecognizedResultStatus_FailsValidation()
    {
        var command = ValidCommand() with
        {
            Results = [new AllureResultItem { Name = "case", Status = "not-a-real-status" }],
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
                    Status = "failed",
                    StatusDetails = new AllureStatusDetails { Message = new string('a', 5001) },
                },
            ],
        };

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Results[0].StatusDetails.Message");
    }
}
