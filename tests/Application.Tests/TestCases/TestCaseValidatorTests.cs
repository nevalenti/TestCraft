using Application.TestCases;

using FluentValidation.TestHelper;

using Xunit;

namespace Application.Tests.TestCases;

public class CreateTestCaseDtoValidatorTests
{
    private readonly CreateTestCaseDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestCaseDto("My Test Case", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new CreateTestCaseDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestCaseDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new CreateTestCaseDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}

public class UpdateTestCaseDtoValidatorTests
{
    private readonly UpdateTestCaseDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestCaseDto("My Test Case", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new UpdateTestCaseDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestCaseDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new UpdateTestCaseDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}