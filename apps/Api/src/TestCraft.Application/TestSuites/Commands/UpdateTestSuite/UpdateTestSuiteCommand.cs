using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestSuites.Commands.UpdateTestSuite;

public record UpdateTestSuiteCommand : IRequest<TestSuiteResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}

public class UpdateTestSuiteCommandValidator : AbstractValidator<UpdateTestSuiteCommand>
{
    public UpdateTestSuiteCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(2000);
    }
}

public class UpdateTestSuiteCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<UpdateTestSuiteCommand, TestSuiteResponse>
{
    public async Task<TestSuiteResponse> Handle(
        UpdateTestSuiteCommand request,
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

        return mapper.Map<TestSuiteResponse>(suite);
    }
}
