using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.TestSuites.Commands.DeleteTestSuite;

public record DeleteTestSuiteCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestSuiteCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteTestSuiteCommand>
{
    public async Task Handle(DeleteTestSuiteCommand request, CancellationToken cancellationToken)
    {
        var suite =
            await context.TestSuites.FirstOrDefaultAsync(
                s => s.Id == request.Id && s.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        suite.IsDeleted = true;
        suite.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
