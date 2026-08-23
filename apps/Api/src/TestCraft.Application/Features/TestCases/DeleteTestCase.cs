using MediatR;

using Microsoft.EntityFrameworkCore;

using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Features.TestCases;

public static class DeleteTestCase
{
    /// <summary>Soft-deletes a test case.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        /// <summary>The project the suite belongs to.</summary>
        [System.Text.Json.Serialization.JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite the test case belongs to.</summary>
        public required TestSuiteId SuiteId { get; init; }

        /// <summary>The test case to delete.</summary>
        public required TestCaseId Id { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var testCase =
                await context.TestCases.FirstOrDefaultAsync(
                    existingTestCase =>
                        existingTestCase.Id == request.Id
                        && existingTestCase.SuiteId == request.SuiteId
                        && existingTestCase.Suite!.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            testCase.IsDeleted = true;
            testCase.DeletedAt = DateTimeOffset.UtcNow;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
