using FluentValidation.TestHelper;
using TestCraft.Application.Projects;

namespace TestCraft.Application.UnitTests.Projects;

public class UpdateProjectValidatorTests
{
    private readonly UpdateProject.Validator _validator = new();

    private static UpdateProject.Command ValidCommand() =>
        new() { Id = Guid.NewGuid(), Name = "Renamed Project" };

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
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void NameExceedingMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Name = new string('a', 256) });
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}
