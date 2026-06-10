using FluentValidation;
using MediatR;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Application.TestRuns;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.Import.Commands.ImportJUnit;

public record ImportJUnitCommand
    : IRequest<TestRunResponse>,
        IProjectScopedRequest
{
    public required Guid ProjectId { get; init; }
    public required string Xml { get; init; }
    public required string Environment { get; init; }
    public string? Name { get; init; }
    public string? Source { get; init; }
}

public class ImportJUnitCommandValidator : AbstractValidator<ImportJUnitCommand>
{
    public ImportJUnitCommandValidator()
    {
        RuleFor(x => x.Xml)
            .NotEmpty()
            .WithMessage("XML content is required")
            .MaximumLength(4_500_000);
        RuleFor(x => x.Environment)
            .NotEmpty()
            .WithMessage("Environment is required")
            .MaximumLength(255);
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(255)
            .When(x => x.Name is not null);
        RuleFor(x => x.Source)
            .NotEmpty()
            .MaximumLength(100)
            .When(x => x.Source is not null);
    }
}

public class ImportJUnitCommandHandler(
    IApplicationDbContext context,
    ICurrentUser currentUser
) : IRequestHandler<ImportJUnitCommand, TestRunResponse>
{
    public Task<TestRunResponse> Handle(
        ImportJUnitCommand request,
        CancellationToken cancellationToken
    )
    {
        var (runName, cases) = JUnitParser.Parse(request.Xml);

        return ImportRunWriter.CreateRunWithResultsAsync(
            context,
            request.ProjectId,
            request.Name ?? runName,
            request.Environment,
            TestRunStatus.Completed,
            cases,
            currentUser.UserId,
            request.Source?.ToLowerInvariant(),
            cancellationToken
        );
    }
}
