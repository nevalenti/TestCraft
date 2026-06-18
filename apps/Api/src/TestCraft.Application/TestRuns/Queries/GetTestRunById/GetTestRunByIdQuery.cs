using AutoMapper;
using AutoMapper.QueryableExtensions;
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

public class GetTestRunByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestRunByIdQuery, TestRunResponse>
{
    public async Task<TestRunResponse> Handle(
        GetTestRunByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestRuns.Where(r => r.Id == request.Id && r.ProjectId == request.ProjectId)
            .ProjectTo<TestRunResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
