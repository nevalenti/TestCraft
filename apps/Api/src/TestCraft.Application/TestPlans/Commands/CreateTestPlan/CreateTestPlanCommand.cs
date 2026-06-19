using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestPlans.Commands.CreateTestPlan;

public record CreateTestPlanCommand : IRequest<TestPlanResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class CreateTestPlanCommandValidator : AbstractValidator<CreateTestPlanCommand>
{
    public CreateTestPlanCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
    }
}

public class CreateTestPlanCommandHandler(IApplicationDbContext context)
    : IRequestHandler<CreateTestPlanCommand, TestPlanResponse>
{
    public async Task<TestPlanResponse> Handle(
        CreateTestPlanCommand request,
        CancellationToken cancellationToken
    )
    {
        var plan = new TestPlan
        {
            Name = request.Name,
            Description = request.Description,
            ProjectId = request.ProjectId,
        };

        context.TestPlans.Add(plan);
        await context.SaveChangesAsync(cancellationToken);

        return await context
            .TestPlans.Where(p => p.Id == plan.Id)
            .Select(p => new TestPlanResponse
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                ProjectId = p.ProjectId,
                CaseCount = 0,
                CreatedAt = p.CreatedAt,
            })
            .FirstAsync(cancellationToken);
    }
}
