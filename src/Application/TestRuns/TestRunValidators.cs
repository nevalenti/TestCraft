using FluentValidation;

namespace Application.TestRuns;

public class CreateTestRunDtoValidator : AbstractValidator<CreateTestRunDto>
{
    public CreateTestRunDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
    }
}

public class UpdateTestRunDtoValidator : AbstractValidator<UpdateTestRunDto>
{
    public UpdateTestRunDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
    }
}