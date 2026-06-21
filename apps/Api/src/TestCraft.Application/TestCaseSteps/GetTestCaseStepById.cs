using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps;

public static class GetTestCaseStepById
{
    public sealed record Query : IRequest<TestCaseStepResponse>, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid CaseId { get; init; }
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
                .TestCaseSteps.Where(s => s.Id == request.Id && s.TestCaseId == request.CaseId)
                .Select(s => new TestCaseStepResponse
                {
                    Id = s.Id,
                    TestCaseId = s.TestCaseId,
                    Order = s.Order,
                    Action = s.Action,
                    ExpectedResult = s.ExpectedResult,
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt,
                })
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException();
    }
}
