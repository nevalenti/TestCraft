using Application.TestCaseSteps;

using FluentValidation.TestHelper;

using Xunit;

namespace Application.Tests.TestCaseSteps;

public class CreateTestCaseStepDtoValidatorTests
{
    private readonly CreateTestCaseStepDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new CreateTestCaseStepDto(1, "Click button", "Page navigates"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Order_WhenNotGreaterThanZero_FailsValidation(int order)
    {
        var result = _validator.TestValidate(new CreateTestCaseStepDto(order, "Click button", "Page navigates"));
        result.ShouldHaveValidationErrorFor(x => x.Order);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Action_WhenEmpty_FailsValidation(string action)
    {
        var result = _validator.TestValidate(new CreateTestCaseStepDto(1, action, "Page navigates"));
        result.ShouldHaveValidationErrorFor(x => x.Action);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void ExpectedResult_WhenEmpty_FailsValidation(string expectedResult)
    {
        var result = _validator.TestValidate(new CreateTestCaseStepDto(1, "Click button", expectedResult));
        result.ShouldHaveValidationErrorFor(x => x.ExpectedResult);
    }
}

public class UpdateTestCaseStepDtoValidatorTests
{
    private readonly UpdateTestCaseStepDtoValidator _validator = new();

    [Fact]
    public void Valid_PassesValidation()
    {
        var result = _validator.TestValidate(new UpdateTestCaseStepDto(1, "Click button", "Page navigates"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Order_WhenNotGreaterThanZero_FailsValidation(int order)
    {
        var result = _validator.TestValidate(new UpdateTestCaseStepDto(order, "Click button", "Page navigates"));
        result.ShouldHaveValidationErrorFor(x => x.Order);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Action_WhenEmpty_FailsValidation(string action)
    {
        var result = _validator.TestValidate(new UpdateTestCaseStepDto(1, action, "Page navigates"));
        result.ShouldHaveValidationErrorFor(x => x.Action);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void ExpectedResult_WhenEmpty_FailsValidation(string expectedResult)
    {
        var result = _validator.TestValidate(new UpdateTestCaseStepDto(1, "Click button", expectedResult));
        result.ShouldHaveValidationErrorFor(x => x.ExpectedResult);
    }
}