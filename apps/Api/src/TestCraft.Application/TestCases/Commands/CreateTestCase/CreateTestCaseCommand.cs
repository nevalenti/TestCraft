using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestCases.Commands.CreateTestCase;

public record CreateTestCaseCommand : IRequest<TestCaseResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid SuiteId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public TestCasePriority? Priority { get; init; }
}

public class CreateTestCaseCommandValidator : AbstractValidator<CreateTestCaseCommand>
{
    public CreateTestCaseCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Priority).IsInEnum().When(x => x.Priority is not null);
    }
}

public class CreateTestCaseCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateTestCaseCommand, TestCaseResponse>
{
    public async Task<TestCaseResponse> Handle(
        CreateTestCaseCommand request,
        CancellationToken cancellationToken
    )
    {
        var testCase = new TestCase
        {
            SuiteId = request.SuiteId,
            Name = request.Name,
            Description = request.Description,
            Priority = request.Priority ?? TestCasePriority.Medium,
        };

        context.TestCases.Add(testCase);
        await context.SaveChangesAsync(cancellationToken);

        return new TestCaseResponse
        {
            Id = testCase.Id,
            SuiteId = testCase.SuiteId,
            Name = testCase.Name,
            Description = testCase.Description,
            Priority = testCase.Priority,
            StepCount = 0,
            CreatedAt = testCase.CreatedAt,
            UpdatedAt = testCase.UpdatedAt,
        };
    }
}
