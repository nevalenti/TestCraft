using Application.Projects;

using FluentValidation.TestHelper;

using Xunit;

namespace Application.Tests.Projects;

public class CreateProjectDtoValidatorTests
{
    private readonly CreateProjectDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateProjectDto("My Project", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new CreateProjectDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateProjectDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new CreateProjectDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}

public class UpdateProjectDtoValidatorTests
{
    private readonly UpdateProjectDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateProjectDto("My Project", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new UpdateProjectDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateProjectDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new UpdateProjectDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}