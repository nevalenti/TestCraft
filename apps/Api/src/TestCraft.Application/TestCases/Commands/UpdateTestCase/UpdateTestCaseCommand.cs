using AutoMapper;
using AutoMapper.QueryableExtensions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Enums;

namespace TestCraft.Application.TestCases.Commands.UpdateTestCase;

public record UpdateTestCaseCommand : IRequest<TestCaseResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public Guid SuiteId { get; init; }
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required TestCasePriority Priority { get; init; }
}

public class UpdateTestCaseCommandValidator : AbstractValidator<UpdateTestCaseCommand>
{
    public UpdateTestCaseCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Priority).IsInEnum();
    }
}

public class UpdateTestCaseCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<UpdateTestCaseCommand, TestCaseResponse>
{
    public async Task<TestCaseResponse> Handle(
        UpdateTestCaseCommand request,
        CancellationToken cancellationToken
    )
    {
        var testCase =
            await context.TestCases.FirstOrDefaultAsync(
                c => c.Id == request.Id && c.SuiteId == request.SuiteId,
                cancellationToken
            ) ?? throw new NotFoundException();

        testCase.Name = request.Name;
        testCase.Description = request.Description;
        testCase.Priority = request.Priority;

        await context.SaveChangesAsync(cancellationToken);

        return await context
            .TestCases.Where(c => c.Id == testCase.Id)
            .ProjectTo<TestCaseResponse>(mapper.ConfigurationProvider)
            .FirstAsync(cancellationToken);
    }
}
