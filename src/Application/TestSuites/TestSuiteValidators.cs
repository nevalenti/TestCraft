using FluentValidation;

namespace Application.TestSuites;

public class CreateTestSuiteDtoValidator : AbstractValidator<CreateTestSuiteDto>
{
    public CreateTestSuiteDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(255);
    }
}

public class UpdateTestSuiteDtoValidator : AbstractValidator<UpdateTestSuiteDto>
{
    public UpdateTestSuiteDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(255);
    }
}