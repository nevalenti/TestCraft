using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestCases;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.UnitTests.TestCases;

public class UpdateTestCaseValidatorTests
{
    private readonly UpdateTestCase.Validator _validator = new();

    private static UpdateTestCase.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            SuiteId = TestSuiteId.New(),
            Id = TestCaseId.New(),
            Name = "Login works",
            Priority = TestCasePriority.Medium,
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

    [Fact]
    public void DescriptionExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Description = new string('a', 2001),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Description);
    }

    [Fact]
    public void OutOfRangePriority_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Priority = (TestCasePriority)999,
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Priority);
    }
}
