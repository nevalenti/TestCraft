using Domain.Enums;

using FluentValidation;

namespace Application.TestResults;

public class CreateTestResultDtoValidator : AbstractValidator<CreateTestResultDto>
{
    public CreateTestResultDtoValidator()
    {
        RuleFor(x => x.TestCaseId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.ExecutedAt).NotEmpty();
    }
}

public class UpdateTestResultDtoValidator : AbstractValidator<UpdateTestResultDto>
{
    public UpdateTestResultDtoValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
    }
}