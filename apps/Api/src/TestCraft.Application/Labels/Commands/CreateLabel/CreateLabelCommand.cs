using AutoMapper;
using AutoMapper.QueryableExtensions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Labels.Commands.CreateLabel;

public record CreateLabelCommand : IRequest<LabelResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required string Name { get; init; }
    public required string Color { get; init; }
}

public class CreateLabelCommandValidator : AbstractValidator<CreateLabelCommand>
{
    public CreateLabelCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Color).NotEmpty().MaximumLength(7).Matches("^#[0-9A-Fa-f]{6}$");
    }
}

public class CreateLabelCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<CreateLabelCommand, LabelResponse>
{
    public async Task<LabelResponse> Handle(
        CreateLabelCommand request,
        CancellationToken cancellationToken
    )
    {
        var label = new Label
        {
            Name = request.Name,
            Color = request.Color,
            ProjectId = request.ProjectId,
        };

        context.Labels.Add(label);
        await context.SaveChangesAsync(cancellationToken);

        return await context
            .Labels.Where(l => l.Id == label.Id)
            .ProjectTo<LabelResponse>(mapper.ConfigurationProvider)
            .FirstAsync(cancellationToken);
    }
}
