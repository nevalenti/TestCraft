using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.TestCaseSteps.Queries.GetTestCaseStepById;

public record GetTestCaseStepByIdQuery : IRequest<TestCaseStepResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestCaseStepByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestCaseStepByIdQuery, TestCaseStepResponse>
{
    public async Task<TestCaseStepResponse> Handle(
        GetTestCaseStepByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestCaseSteps.Where(s => s.Id == request.Id && s.TestCaseId == request.CaseId)
            .Select(TestCaseStepResponse.Projection)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
