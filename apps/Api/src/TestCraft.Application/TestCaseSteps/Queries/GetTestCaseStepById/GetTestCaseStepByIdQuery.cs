using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps.Queries.GetTestCaseStepById;

public record GetTestCaseStepByIdQuery : IRequest<TestCaseStepResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required Guid Id { get; init; }
}

public class GetTestCaseStepByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetTestCaseStepByIdQuery, TestCaseStepResponse>
{
    public async Task<TestCaseStepResponse> Handle(
        GetTestCaseStepByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .TestCaseSteps.Where(s => s.Id == request.Id && s.TestCaseId == request.CaseId)
            .ProjectTo<TestCaseStepResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
