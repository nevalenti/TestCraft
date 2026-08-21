using FluentValidation.TestHelper;
using TestCraft.Application.Features.TestPlans;

namespace TestCraft.Application.UnitTests.TestPlans;

public class CreateRunFromPlanValidatorTests
{
    private readonly CreateRunFromPlan.Validator _validator = new();

    private static CreateRunFromPlan.Command ValidCommand() =>
        new()
        {
            ProjectId = ProjectId.New(),
            TestPlanId = TestPlanId.New(),
            Name = "Release 1.0 Run",
            Environment = "staging",
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

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void EmptyOrWhitespaceEnvironment_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(ValidCommand() with { Environment = environment });
        result.ShouldHaveValidationErrorFor(command => command.Environment);
    }

    [Fact]
    public void EnvironmentExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Environment = new string('a', 101),
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Environment);
    }
}
