using FluentValidation.TestHelper;

using TestCraft.Application.Features.ProjectMembers;

namespace TestCraft.Application.UnitTests.ProjectMembers;

public class AddProjectMemberValidatorTests
{
    private readonly AddProjectMember.Validator _validator = new();

    private static AddProjectMember.Command ValidCommand() =>
        new() { ProjectId = ProjectId.New(), Email = "teammate@example.com" };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("not-an-email")]
    public void InvalidEmail_FailsValidation(string email)
    {
        var result = _validator.TestValidate(ValidCommand() with { Email = email });
        result.ShouldHaveValidationErrorFor(command => command.Email);
    }

    [Fact]
    public void EmailExceedingMaxLength_FailsValidation()
    {
        var longLocalPart = new string('a', 250);
        var result = _validator.TestValidate(
            ValidCommand() with
            {
                Email = $"{longLocalPart}@example.com",
            }
        );
        result.ShouldHaveValidationErrorFor(command => command.Email);
    }
}
