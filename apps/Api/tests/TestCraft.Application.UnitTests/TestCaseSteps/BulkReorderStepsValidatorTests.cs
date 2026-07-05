using FluentValidation.TestHelper;
using TestCraft.Application.TestCaseSteps;

namespace TestCraft.Application.UnitTests.TestCaseSteps;

public class BulkReorderStepsValidatorTests
{
    private readonly BulkReorderSteps.Validator _validator = new();

    private static BulkReorderSteps.Command ValidCommand() =>
        new()
        {
            ProjectId = Guid.NewGuid(),
            CaseId = Guid.NewGuid(),
            Steps =
            [
                new BulkReorderSteps.StepOrder { Id = Guid.NewGuid(), Order = 1 },
                new BulkReorderSteps.StepOrder { Id = Guid.NewGuid(), Order = 2 },
            ],
        };

    [Fact]
    public void ValidCommand_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void EmptySteps_FailsValidation()
    {
        var result = _validator.TestValidate(ValidCommand() with { Steps = [] });
        result.ShouldHaveValidationErrorFor(x => x.Steps);
    }

    [Fact]
    public void StepWithOrderZero_FailsValidation()
    {
        var command = ValidCommand() with
        {
            Steps = [new BulkReorderSteps.StepOrder { Id = Guid.NewGuid(), Order = 0 }],
        };

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor("Steps[0].Order");
    }

    [Fact]
    public void DuplicateStepIds_FailsValidation()
    {
        var duplicateId = Guid.NewGuid();
        var command = ValidCommand() with
        {
            Steps =
            [
                new BulkReorderSteps.StepOrder { Id = duplicateId, Order = 1 },
                new BulkReorderSteps.StepOrder { Id = duplicateId, Order = 2 },
            ],
        };

        var result = _validator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Steps);
    }

    [Fact]
    public void DistinctStepIds_PassesValidation()
    {
        var result = _validator.TestValidate(ValidCommand());
        result.ShouldNotHaveValidationErrorFor(x => x.Steps);
    }
}
