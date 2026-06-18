using AutoMapper;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestSuites.Commands.CreateTestSuite;

public record CreateTestSuiteCommand : IRequest<TestSuiteResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class CreateTestSuiteCommandValidator : AbstractValidator<CreateTestSuiteCommand>
{
    public CreateTestSuiteCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(2000);
    }
}

public class CreateTestSuiteCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<CreateTestSuiteCommand, TestSuiteResponse>
{
    public async Task<TestSuiteResponse> Handle(
        CreateTestSuiteCommand request,
        CancellationToken cancellationToken
    )
    {
        var suite = new TestSuite
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Description = request.Description,
        };

        context.TestSuites.Add(suite);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<TestSuiteResponse>(suite);
    }
}
