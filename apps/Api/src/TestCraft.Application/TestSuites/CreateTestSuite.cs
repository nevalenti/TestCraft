using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.TestSuites;

public record TestSuiteResponse
{
    public required Guid Id { get; init; }
    public required Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public string? Source { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public required DateTimeOffset UpdatedAt { get; init; }
}

public static class CreateTestSuite
{
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        public Guid ProjectId { get; init; }
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
            var suite = new TestSuite
            {
                ProjectId = request.ProjectId,
                Name = request.Name,
                Description = request.Description,
            };

            context.TestSuites.Add(suite);
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
