using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites;

public static class UpdateTestSuite
{
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
        public required Guid Id { get; init; }
        public required string Name { get; init; }
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
            RuleFor(x => x.Description).MaximumLength(2000);
        }
    }

    public sealed class Handler(IApplicationDbContext context)
        : IRequestHandler<Command, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var suite =
                await context.TestSuites.FirstOrDefaultAsync(
                    s => s.Id == request.Id && s.ProjectId == request.ProjectId,
                    cancellationToken
                ) ?? throw new NotFoundException();

            suite.Name = request.Name;
            suite.Description = request.Description;

            await context.SaveChangesAsync(cancellationToken);

            return new TestSuiteResponse
            {
                Id = suite.Id,
                ProjectId = suite.ProjectId,
                Name = suite.Name,
                Description = suite.Description,
                Source = suite.Source,
                CreatedAt = suite.CreatedAt,
                UpdatedAt = suite.UpdatedAt,
            };
        }
    }
}
