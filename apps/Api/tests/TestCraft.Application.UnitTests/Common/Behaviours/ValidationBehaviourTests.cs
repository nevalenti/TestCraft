using FluentAssertions;

using FluentValidation;

using MediatR;

using TestCraft.Application.Common.Behaviours;

namespace TestCraft.Application.UnitTests.Common.Behaviours;

public class ValidationBehaviourTests
{
    private sealed record TestRequest(string Name) : IRequest<string>;

    [Fact]
    public async Task Handle_NoValidators_InvokesNext()
    {
        var behaviour = new ValidationBehaviour<TestRequest, string>([]);

        var result = await behaviour.Handle(
            new TestRequest("anything"),
            PipelineTestHelpers.NextReturning("next-called"),
            CancellationToken.None
        );

        result.Should().Be("next-called");
    }

    [Fact]
    public async Task Handle_ValidatorsPass_InvokesNext()
    {
        var validator = new InlineValidator<TestRequest>();
        validator.RuleFor(request => request.Name).NotEmpty();

        var behaviour = new ValidationBehaviour<TestRequest, string>([validator]);

        var result = await behaviour.Handle(
            new TestRequest("valid"),
            PipelineTestHelpers.NextReturning("next-called"),
            CancellationToken.None
        );

        result.Should().Be("next-called");
    }

    [Fact]
    public async Task Handle_ValidatorFails_ThrowsValidationException()
    {
        var validator = new InlineValidator<TestRequest>();
        validator.RuleFor(request => request.Name).NotEmpty();

        var behaviour = new ValidationBehaviour<TestRequest, string>([validator]);

        var act = () =>
            behaviour.Handle(
                new TestRequest(string.Empty),
                PipelineTestHelpers.NextReturning("next-called"),
                CancellationToken.None
            );

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task Handle_MultipleValidatorsOneFails_ThrowsValidationExceptionWithFailure()
    {
        var nameValidator = new InlineValidator<TestRequest>();
        nameValidator.RuleFor(request => request.Name).NotEmpty();

        var lengthValidator = new InlineValidator<TestRequest>();
        lengthValidator.RuleFor(request => request.Name).MaximumLength(3);

        var behaviour = new ValidationBehaviour<TestRequest, string>([
            nameValidator,
            lengthValidator,
        ]);

        var act = () =>
            behaviour.Handle(
                new TestRequest("too-long"),
                PipelineTestHelpers.NextReturning("next-called"),
                CancellationToken.None
            );

        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.Errors.Should().ContainSingle();
    }
}
