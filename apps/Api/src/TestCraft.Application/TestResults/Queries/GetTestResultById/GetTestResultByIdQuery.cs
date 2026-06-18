using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestResults.Queries.GetTestResultById;

public record GetTestResultByIdQuery : IRequest<TestResultResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestResultByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestResultByIdQuery, TestResultResponse>
{
    public async Task<TestResultResponse> Handle(
        GetTestResultByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestResults.Where(r => r.Id == request.Id && r.TestRunId == request.RunId)
            .ProjectTo<TestResultResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
