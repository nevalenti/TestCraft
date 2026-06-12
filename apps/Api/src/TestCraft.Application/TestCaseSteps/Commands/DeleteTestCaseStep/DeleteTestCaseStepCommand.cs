using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCaseSteps.Commands.DeleteTestCaseStep;

public record DeleteTestCaseStepCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid CaseId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestCaseStepCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteTestCaseStepCommand>
{
    public async Task Handle(DeleteTestCaseStepCommand request, CancellationToken cancellationToken)
    {
        var step =
            await context.TestCaseSteps.FirstOrDefaultAsync(
                s => s.Id == request.Id && s.TestCaseId == request.CaseId,
                cancellationToken
            ) ?? throw new NotFoundException();

        step.IsDeleted = true;
        step.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
