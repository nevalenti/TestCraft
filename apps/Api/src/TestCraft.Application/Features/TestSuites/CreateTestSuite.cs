using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.TestSuites;

public static class CreateTestSuite
{
    /// <summary>Creates a new suite in a project.</summary>
    public sealed record Command : IRequest<TestSuiteResponse>, IProjectScopedRequest
    {
        /// <summary>The project to create the suite in.</summary>
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        /// <summary>The suite's display name.</summary>
        public required string Name { get; init; }

        /// <summary>The suite's description.</summary>
        public string? Description { get; init; }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Name).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.Description).MaximumLength(2000);
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        IDbExceptionClassifier dbExceptionClassifier
    ) : IRequestHandler<Command, TestSuiteResponse>
    {
        public async Task<TestSuiteResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var suite = TestSuite.Create(request.ProjectId, request.Name, request.Description);

            context.TestSuites.Add(suite);

            await context.SaveOrConflictAsync(
                dbExceptionClassifier,
                CatalogConflicts.SuiteNameTaken(),
                cancellationToken
            );

            return TestSuiteResponse.FromEntity(suite);
        }
    }
}
