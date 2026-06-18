using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites.Queries.GetTestSuiteById;

public record GetTestSuiteByIdQuery : IRequest<TestSuiteResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestSuiteByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestSuiteByIdQuery, TestSuiteResponse>
{
    public async Task<TestSuiteResponse> Handle(
        GetTestSuiteByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestSuites.Where(s => s.Id == request.Id && s.ProjectId == request.ProjectId)
            .ProjectTo<TestSuiteResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
