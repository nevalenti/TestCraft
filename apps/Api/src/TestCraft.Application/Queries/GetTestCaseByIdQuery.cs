using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Responses;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Queries;

public record GetTestCaseByIdQuery : IRequest<TestCaseResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid SuiteId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestCaseByIdQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetTestCaseByIdQuery, TestCaseResponse>
{
    public async Task<TestCaseResponse> Handle(
        GetTestCaseByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestCases.Where(c => c.Id == request.Id && c.SuiteId == request.SuiteId)
            .Select(TestCaseResponse.Projection)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
