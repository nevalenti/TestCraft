using FluentValidation.TestHelper;

using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.UnitTests.TestPlans;

public class CreateTestPlanValidatorTests
{
    private readonly CreateTestPlan.Validator _validator = new();

    private static CreateTestPlan.Command ValidCommand() =>
        new() { ProjectId = ProjectId.New(), Name = "Release 1.0 Plan" };

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
    public void NullDescription_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Description = null });
        result.ShouldNotHaveValidationErrorFor(command => command.Description);
    }
}
