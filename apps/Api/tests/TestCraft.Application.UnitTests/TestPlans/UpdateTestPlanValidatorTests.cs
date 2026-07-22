using FluentValidation.TestHelper;
using TestCraft.Application.TestPlans;

namespace TestCraft.Application.UnitTests.TestPlans;

public class UpdateTestPlanValidatorTests
{
    private readonly UpdateTestPlan.Validator _validator = new();

    private static UpdateTestPlan.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            Id = Guid.NewGuid(),
            Name = "Release 1.0 Plan",
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
}
