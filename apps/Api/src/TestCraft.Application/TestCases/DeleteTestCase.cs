using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestCases;

public static class DeleteTestCase
{
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        public required Guid ProjectId { get; init; }
        public required Guid SuiteId { get; init; }
        public required Guid Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
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
}
