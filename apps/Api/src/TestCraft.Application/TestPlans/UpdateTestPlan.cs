using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestPlans;

public static class UpdateTestPlan
{
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public Guid Id { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestPlanResponse>
    {
        public async Task<TestPlanResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var plan =
                await context.TestPlans.FirstOrDefaultAsync(
                    p => p.Id == request.Id && p.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            plan.Name = request.Name;
            plan.Description = request.Description;

            await context.SaveChangesAsync(cancellationToken);

            return await context
                .TestPlans.Where(p => p.Id == plan.Id)
                .Select(p => new TestPlanResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    ProjectId = p.ProjectId,
                    CaseCount = p.TestPlanCases.Count(tpc =>
                        tpc.TestCase != null && !tpc.TestCase.IsDeleted
                    ),
                    CreatedAt = p.CreatedAt,
                })
                .FirstAsync(cancellationToken);
        }
    }
}
