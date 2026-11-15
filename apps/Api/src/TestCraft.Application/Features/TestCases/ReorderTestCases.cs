using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Exceptions;

namespace TestCraft.Application.Features.TestCases;

public static class ReorderTestCases
{
    /// <summary>The new position for one test case.</summary>
    public sealed record CaseOrder
    {
        /// <summary>ID of the test case to reposition.</summary>
        public required TestCaseId Id { get; init; }

        /// <summary>The test case's new place within its section, lowest first.</summary>
        public required int Position { get; init; }
    }

    /// <summary>Sets the position of several test cases of a suite in one request.</summary>
    public sealed record Command : IRequest, IProjectScopedRequest
    {
        [JsonIgnore]
        public ProjectId ProjectId { get; init; }

        [JsonIgnore]
        public TestSuiteId SuiteId { get; init; }

        /// <summary>The test cases to reposition. Cases not listed keep their position.</summary>
        public required IReadOnlyList<CaseOrder> Cases { get; init; }
    }

    public sealed class CaseOrderValidator : AbstractValidator<CaseOrder>
    {
        public CaseOrderValidator()
        {
            RuleFor(order => order.Position).GreaterThanOrEqualTo(1);
        }
    }

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.Cases).NotEmpty();
            RuleForEach(command => command.Cases).SetValidator(new CaseOrderValidator());
            RuleFor(command => command.Cases)
                .Must(cases => cases.Select(order => order.Id).Distinct().Count() == cases.Count)
                .WithMessage("Duplicate test case IDs are not allowed")
                .When(command => command.Cases.Count > 0);
        }
    }

    public sealed class Handler(IApplicationDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            await context.TestSuites.EnsureExistsAsync(
                suite => suite.Id == request.SuiteId && suite.ProjectId == request.ProjectId,
                cancellationToken
            );

            var positions = request.Cases.ToDictionary(order => order.Id, order => order.Position);
            var ids = positions.Keys.ToList();
            var cases = await context
                .TestCases.Where(testCase =>
                    testCase.SuiteId == request.SuiteId && ids.Contains(testCase.Id)
                )
                .ToListAsync(cancellationToken);

            if (cases.Count != ids.Count)
            {
                throw new DomainException("One or more test cases not found in this suite")
                {
                    ErrorCode = DomainErrorCodes.CasesNotFound,
                };
            }

            foreach (var testCase in cases)
            {
                testCase.Reorder(positions[testCase.Id]);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
