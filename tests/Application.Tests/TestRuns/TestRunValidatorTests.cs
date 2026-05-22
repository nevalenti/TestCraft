using Application.TestRuns;

using Domain.Enums;

using FluentValidation.TestHelper;

using Xunit;

namespace Application.Tests.TestRuns;

public class CreateTestRunDtoValidatorTests
{
    private readonly CreateTestRunDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestRunDto("Run 1", "Staging"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new CreateTestRunDto(name, "Staging"));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestRunDto(new string('a', 255), "Staging"));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new CreateTestRunDto(new string('a', 256), "Staging"));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Environment_WhenEmpty_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(new CreateTestRunDto("Run 1", environment));
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void Environment_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestRunDto("Run 1", new string('a', 255)));
        result.ShouldNotHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void Environment_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new CreateTestRunDto("Run 1", new string('a', 256)));
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }
}

public class UpdateTestRunDtoValidatorTests
{
    private readonly UpdateTestRunDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestRunDto("Run 1", "Staging", TestRunStatus.Active));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Name_WhenEmpty_FailsValidation(string name)
    {
        var result = _validator.TestValidate(new UpdateTestRunDto(name, "Staging", TestRunStatus.Active));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestRunDto(new string('a', 255), "Staging", TestRunStatus.Active));
        result.ShouldNotHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public void Name_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new UpdateTestRunDto(new string('a', 256), "Staging", TestRunStatus.Active));
        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Environment_WhenEmpty_FailsValidation(string environment)
    {
        var result = _validator.TestValidate(new UpdateTestRunDto("Run 1", environment, TestRunStatus.Active));
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void Environment_WhenAtMaxLength_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestRunDto("Run 1", new string('a', 255), TestRunStatus.Active));
        result.ShouldNotHaveValidationErrorFor(x => x.Environment);
    }

    [Fact]
    public void Environment_WhenExceedsMaxLength_FailsValidation()
    {
        var result = _validator.TestValidate(new UpdateTestRunDto("Run 1", new string('a', 256), TestRunStatus.Active));
        result.ShouldHaveValidationErrorFor(x => x.Environment);
    }
}