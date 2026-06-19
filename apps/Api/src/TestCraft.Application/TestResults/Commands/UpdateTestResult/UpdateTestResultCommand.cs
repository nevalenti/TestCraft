using AutoMapper;
using AutoMapper.QueryableExtensions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Caching;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;
using TestCraft.Domain.Rules;

namespace TestCraft.Application.TestResults.Commands.UpdateTestResult;

public record UpdateTestResultCommand : IRequest<TestResultResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid RunId { get; init; }
    public required Guid Id { get; init; }
    public required TestResultStatus Status { get; init; }
    public string? Notes { get; init; }
    public DefectType? DefectType { get; init; }
}

public class UpdateTestResultCommandValidator : AbstractValidator<UpdateTestResultCommand>
{
    public UpdateTestResultCommandValidator()
    {
        RuleFor(x => x.Status).IsInEnum();
        RuleFor(x => x.Notes).MaximumLength(5000);
    }
}

public class UpdateTestResultCommandHandler(
    IApplicationDbContext context,
    ICacheService cache,
    IMapper mapper,
    ITestRunNotifier notifier
) : IRequestHandler<UpdateTestResultCommand, TestResultResponse>
{
    public async Task<TestResultResponse> Handle(
        UpdateTestResultCommand request,
        CancellationToken cancellationToken
    )
    {
        var run =
            await context.TestRuns.FirstOrDefaultAsync(
                r => r.Id == request.RunId && r.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        if (!TestRunRules.CanAddResultToRun(run.Status))
        {
            throw new DomainException($"Cannot modify results in a {run.Status} test run");
        }

        var result =
            await context.TestResults.FirstOrDefaultAsync(
                r => r.Id == request.Id && r.TestRunId == request.RunId,
                cancellationToken
            ) ?? throw new NotFoundException();

        result.Status = request.Status;
        result.Notes = request.Notes;
        result.DefectType = request.DefectType;

        await context.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.TestRunResponse(request.RunId), cancellationToken);

        var summary = await context
            .TestResults.Where(r => r.Id == result.Id)
            .ProjectTo<TestResultResponse>(mapper.ConfigurationProvider)
            .FirstAsync(cancellationToken);

        await notifier.ResultUpdatedAsync(request.RunId, summary, cancellationToken);

        return summary;
    }
}
