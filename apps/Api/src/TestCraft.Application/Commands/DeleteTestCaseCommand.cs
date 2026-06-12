using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Errors;

namespace TestCraft.Application.Commands;

public record DeleteTestCaseCommand : IRequest, IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid SuiteId { get; init; }
    public required Guid Id { get; init; }
}

public class DeleteTestCaseCommandHandler(IApplicationDbContext context)
    : IRequestHandler<DeleteTestCaseCommand>
{
    public async Task Handle(DeleteTestCaseCommand request, CancellationToken cancellationToken)
    {
        var testCase =
            await context.TestCases.FirstOrDefaultAsync(
                c => c.Id == request.Id && c.SuiteId == request.SuiteId,
                cancellationToken
            ) ?? throw new NotFoundException();

        testCase.IsDeleted = true;
        testCase.DeletedAt = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
    }
}
