using Application.TestSuites;

using FluentValidation.TestHelper;

using Xunit;

namespace Application.Tests.TestSuites;

public class CreateTestSuiteDtoValidatorTests
{
    private readonly CreateTestSuiteDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestSuiteDto("My Suite", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new CreateTestSuiteDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestSuiteDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new CreateTestSuiteDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}

public class UpdateTestSuiteDtoValidatorTests
{
    private readonly UpdateTestSuiteDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestSuiteDto("My Suite", "desc"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new UpdateTestSuiteDto(name, null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestSuiteDto(new string('a', 255), null));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new UpdateTestSuiteDto(new string('a', 256), null));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }
}