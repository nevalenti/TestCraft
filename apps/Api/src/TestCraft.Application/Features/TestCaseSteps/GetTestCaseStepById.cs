using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class GetTestCaseStepById
{
    /// <summary>Requests a single test case step by id.</summary>
    public sealed record Query : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        /// <summary>The project the test case belongs to.</summary>
        public required Guid ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        public required Guid CaseId { get; init; }

        /// <summary>The step to look up.</summary>
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Query, TestCaseStepResponse>
    {
        public async Task<TestCaseStepResponse> Handle(
            Query request,
            CancellationToken cancellationToken
        ) =>
            await context
                .TestCaseSteps.Where(step =>
                    step.Id == request.Id
                    && step.TestCaseId == request.CaseId
                    && step.TestCase!.Suite!.ProjectId == request.ProjectId
                )
                .Select(step => new TestCaseStepResponse
                {
                    Id = step.Id,
                    TestCaseId = step.TestCaseId,
                    Order = step.Order,
                    Action = step.Action,
                    ExpectedResult = step.ExpectedResult,
                    CreatedAt = step.CreatedAt,
                    UpdatedAt = step.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
