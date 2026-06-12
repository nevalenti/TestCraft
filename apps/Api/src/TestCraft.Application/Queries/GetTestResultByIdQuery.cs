using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Responses;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Queries;

public record GetTestResultByIdQuery : IRequest<TestResultResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestResultByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestResultByIdQuery, TestResultResponse>
{
    public async Task<TestResultResponse> Handle(
        GetTestResultByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestResults.Where(r => r.Id == request.Id && r.TestRunId == request.RunId)
            .Select(TestResultResponse.Projection)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
