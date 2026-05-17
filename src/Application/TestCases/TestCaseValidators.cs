using FluentValidation;

namespace Application.TestCases;

public class CreateTestCaseDtoValidator : AbstractValidator<CreateTestCaseDto>
{
    public CreateTestCaseDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(255);
    }
}

public class UpdateTestCaseDtoValidator : AbstractValidator<UpdateTestCaseDto>
{
    public UpdateTestCaseDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(255);
    }
}