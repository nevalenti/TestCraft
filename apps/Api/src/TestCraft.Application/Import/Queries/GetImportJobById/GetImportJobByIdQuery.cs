using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Import.Queries.GetImportJobById;

public record GetImportJobByIdQuery : IRequest<ImportJobResponse>, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class GetImportJobByIdQueryHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<GetImportJobByIdQuery, ImportJobResponse>
{
    public async Task<ImportJobResponse> Handle(
        GetImportJobByIdQuery request,
        CancellationToken cancellationToken
    ) =>
        await context
            .ImportJobs.Where(j => j.Id == request.Id && j.ProjectId == request.ProjectId)
            .ProjectTo<ImportJobResponse>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync(cancellationToken)
        ?? throw new NotFoundException();
}
