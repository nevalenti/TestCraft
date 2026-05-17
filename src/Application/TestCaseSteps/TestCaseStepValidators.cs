using FluentValidation;

namespace Application.TestCaseSteps;

public class CreateTestCaseStepDtoValidator : AbstractValidator<CreateTestCaseStepDto>
{
    public CreateTestCaseStepDtoValidator()
    {
        RuleFor(x => x.Order).GreaterThan(0);
        RuleFor(x => x.Action).NotEmpty();
        RuleFor(x => x.ExpectedResult).NotEmpty();
    }
}

public class UpdateTestCaseStepDtoValidator : AbstractValidator<UpdateTestCaseStepDto>
{
    public UpdateTestCaseStepDtoValidator()
    {
        RuleFor(x => x.Order).GreaterThan(0);
        RuleFor(x => x.Action).NotEmpty();
        RuleFor(x => x.ExpectedResult).NotEmpty();
    }
}