using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Errors;
using TestCraft.Domain.Rules;

namespace TestCraft.Application.TestResults.Commands.CreateTestResult;

public record CreateTestResultCommand
    : IRequest<TestResultResponse>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid TestCaseId { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public required DateTimeOffset ExecutedAt { get; init; }
}

public class CreateTestResultCommandValidator
    : AbstractValidator<CreateTestResultCommand>
{
    public CreateTestResultCommandValidator()
    {
        RuleFor(x => x.TestCaseId).NotEmpty();
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Notes).MaximumLength(5000);
    }
}

public class CreateTestResultCommandHandler(
    IApplicationDbContext context,
    ICacheService cache,
    ICurrentUser currentUser
) : IRequestHandler<CreateTestResultCommand, TestResultResponse>
{
    public async Task<TestResultResponse> Handle(
        CreateTestResultCommand request,
        CancellationToken cancellationToken
    )
    {
        var run =
            await context.TestRuns.FirstOrDefaultAsync(
                r => r.Id == request.RunId,
                cancellationToken
            ) ?? throw new NotFoundException();

        if (!TestRunRules.CanAddResultToRun(run.Status))
        {
            throw new DomainException(
                $"Cannot modify results in a {run.Status} test run"
            );
        }

        var result = new TestResult
        {
            TestRunId = request.RunId,
            TestCaseId = request.TestCaseId,
            Status = request.Status,
            Notes = request.Notes,
            ExecutedAt = request.ExecutedAt,
            ExecutedById = currentUser.UserId,
        };

        context.TestResults.Add(result);
        await context.SaveChangesAsync(cancellationToken);

        var summary = await context
            .TestResults.Where(r => r.Id == result.Id)
            .Select(TestResultResponse.Projection)
            .FirstAsync(cancellationToken);

        await cache.RemoveAsync(
            CacheKeys.TestRunResponse(request.RunId),
            cancellationToken
        );

        return summary;
    }
}
