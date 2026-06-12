using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.Import;
using TestCraft.Application.Responses;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Commands;

public record ImportAllureCommand : IRequest<TestRunResponse>, IProjectScopedRequest
{
    public const string DefaultRunName = "Allure Import";

    public required Guid ProjectId { get; init; }
    public required IReadOnlyList<AllureResultItem> Results { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
}

public class ImportAllureCommandValidator : AbstractValidator<ImportAllureCommand>
{
    private static readonly string[] ValidStatuses =
    [
        "passed",
        "failed",
        "broken",
        "skipped",
        "unknown",
    ];

    public ImportAllureCommandValidator()
    {
        RuleFor(x => x.Results)
            .NotEmpty()
            .WithMessage("At least one result is required")
            .Must(results => results.Count <= 10_000)
            .WithMessage("Too many results — split into smaller batches");

        RuleFor(x => x.Environment)
            .NotEmpty()
            .WithMessage("Environment is required")
            .MaximumLength(255);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255).When(x => x.Name is not null);
        RuleFor(x => x.Source).NotEmpty().MaximumLength(100).When(x => x.Source is not null);

        RuleForEach(x => x.Results)
            .ChildRules(result =>
            {
                result
                    .RuleFor(r => r.Status)
                    .Must(status => ValidStatuses.Contains(status))
                    .When(r => r.Status is not null);

                result
                    .RuleFor(r => r.StatusDetails!.Message)
                    .MaximumLength(5000)
                    .When(r => r.StatusDetails?.Message is not null);

                result
                    .RuleFor(r => r.StatusDetails!.Trace)
                    .MaximumLength(5000)
                    .When(r => r.StatusDetails?.Trace is not null);
            });
    }
}

public class ImportAllureCommandHandler(IApplicationDbContext context, ICurrentUser currentUser)
    : IRequestHandler<ImportAllureCommand, TestRunResponse>
{
    public Task<TestRunResponse> Handle(
        ImportAllureCommand request,
        CancellationToken cancellationToken
    )
    {
        var cases = AllureParser.Parse(request.Results);

        return ImportRunWriter.CreateRunWithResultsAsync(
            context,
            request.ProjectId,
            request.Name ?? ImportAllureCommand.DefaultRunName,
            request.Environment,
            TestRunStatus.Completed,
            cases,
            currentUser.UserId,
            request.Source?.ToLowerInvariant(),
            cancellationToken
        );
    }
}
