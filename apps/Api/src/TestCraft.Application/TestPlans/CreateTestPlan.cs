using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestPlans;

public record TestPlanResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required Guid ProjectId { get; init; }
    public required int CaseCount { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
}

public record TestPlanDetailResponse
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required Guid ProjectId { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required IReadOnlyList<TestPlanCaseResponse> Cases { get; init; }
}

public record TestPlanCaseResponse
{
    public required Guid TestCaseId { get; init; }
    public required string TestCaseName { get; init; }
    public required string SuiteName { get; init; }
    public required int Order { get; init; }
}

public static class CreateTestPlan
{
    public sealed record Command : IRequest<TestPlanResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
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
}
