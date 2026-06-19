using AutoMapper;
using AutoMapper.QueryableExtensions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Exceptions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.Labels.Commands.UpdateLabel;

public record UpdateLabelCommand : IRequest<LabelResponse>, IProjectScopedRequest
{
    public Guid ProjectId { get; init; }
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Color { get; init; }
}

public class UpdateLabelCommandValidator : AbstractValidator<UpdateLabelCommand>
{
    public UpdateLabelCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Color).NotEmpty().MaximumLength(7).Matches("^#[0-9A-Fa-f]{6}$");
    }
}

public class UpdateLabelCommandHandler(IApplicationDbContext context, IMapper mapper)
    : IRequestHandler<UpdateLabelCommand, LabelResponse>
{
    public async Task<LabelResponse> Handle(
        UpdateLabelCommand request,
        CancellationToken cancellationToken
    )
    {
        var label =
            await context.Labels.FirstOrDefaultAsync(
                l => l.Id == request.Id && l.ProjectId == request.ProjectId,
                cancellationToken
            ) ?? throw new NotFoundException();

        label.Name = request.Name;
        label.Color = request.Color;

        await context.SaveChangesAsync(cancellationToken);

        return await context
            .Labels.Where(l => l.Id == label.Id)
            .ProjectTo<LabelResponse>(mapper.ConfigurationProvider)
            .FirstAsync(cancellationToken);
    }
}
