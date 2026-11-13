using MediatR;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCaseSteps;

public static class GetTestCaseStepById
{
    public sealed record Query : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        public required ProjectId ProjectId { get; init; }

        /// <summary>The test case the step belongs to.</summary>
        public required TestCaseId CaseId { get; init; }

        public required TestCaseStepId Id { get; init; }
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
                .Select(TestCaseStepResponse.Projection)
                .FirstOrNotFoundAsync(cancellationToken);
    }
}
