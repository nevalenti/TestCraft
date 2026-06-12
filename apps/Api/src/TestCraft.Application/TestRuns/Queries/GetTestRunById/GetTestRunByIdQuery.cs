using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestRuns.Queries.GetTestRunById;

public record GetTestRunByIdQuery : IRequest<TestRunResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestRunByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestRunByIdQuery, TestRunResponse>
{
    public async Task<TestRunResponse> Handle(
        GetTestRunByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestRuns.Where(r => r.Id == request.Id && r.ProjectId == request.ProjectId)
            .Select(TestRunResponse.Projection)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
