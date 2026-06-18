using AutoMapper;
using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestRuns.Commands.CreateTestRun;

public record CreateTestRunCommand : IRequest<TestRunResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Environment { get; init; }
    public TestRunStatus? Status { get; init; }
}

public class CreateTestRunCommandValidator : AbstractValidator<CreateTestRunCommand>
{
    public CreateTestRunCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Environment).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status is not null);
    }
}

public class CreateTestRunCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<CreateTestRunCommand, TestRunResponse>
{
    public async Task<TestRunResponse> Handle(
        CreateTestRunCommand request,
        CancellationToken cancellationToken
    )
    {
        var run = new TestRun
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Environment = request.Environment,
            Status = request.Status ?? TestRunStatus.Active,
        };

        context.TestRuns.Add(run);
        await context.SaveChangesAsync(cancellationToken);

        return mapper.Map<TestRunResponse>(run);
    }
}
