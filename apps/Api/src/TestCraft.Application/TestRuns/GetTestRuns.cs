using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Pagination;
using TestCraft.Application.Common.Security;

namespace TestCraft.Application.TestRuns;

public static class GetTestRuns
{
    /// <summary>Lists the test runs in a project.</summary>
    public sealed record Query : IRequest<Paginated<TestRunResponse>>, IProjectScopedRequest
    {
        /// <summary>The project to list runs for.</summary>
        public Guid ProjectId { get; init; }

        /// <summary>Filters runs whose name contains this text.</summary>
        public string? Search { get; init; }

        /// <summary>The page number to return, starting at 1.</summary>
        public int? Page { get; init; }

        /// <summary>The number of runs per page.</summary>
        public int? PageSize { get; init; }
    }

    public sealed class Handler(IApplicationDbContext context, IStorageService storage)
        : IRequestHandler<Query, Paginated<TestRunResponse>>
    {
        public async Task<Paginated<TestRunResponse>> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var query = context.TestRuns.Where(run => run.ProjectId == request.ProjectId);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                query = query.Where(run => EF.Functions.ILike(run.Name, $"%{request.Search}%"));
            }

            var pagination = PaginationParams.Create(request.Page, request.PageSize);

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(run => run.CreatedAt)
                .Skip(pagination.Skip)
                .Take(pagination.Take)
                .Select(run => new TestRunResponse
                {
                    Id = run.Id,
                    ProjectId = run.ProjectId,
                    Name = run.Name,
                    Environment = run.Environment,
                    Status = run.Status,
                    Source = run.Source,
                    ExecutedById = run.ExecutedById,
                    ExecutedByName = run.ExecutedByName,
                    CreatedAt = run.CreatedAt,
                    UpdatedAt = run.UpdatedAt,
                })
                .ToListAsync(cancellationToken);

            await PopulateAvatarUrlsAsync(items, context, storage, cancellationToken);

            return new Paginated<TestRunResponse>
            {
                Items = items,
                Total = total,
                Page = pagination.Page,
                PageSize = pagination.PageSize,
            };
        }
    }

    internal static async Task PopulateAvatarUrlsAsync(
        IList<TestRunResponse> items,
        IApplicationDbContext context,
        IStorageService storage,
        CancellationToken cancellationToken
    )
    {
        var executorIds = items
            .Where(item => item.ExecutedById is not null)
            .Select(item => item.ExecutedById!.Value)
            .Distinct()
            .ToList();

        if (executorIds.Count == 0)
            return;

        var avatarKeys = await context
            .UserProfiles.AsNoTracking()
            .Where(profile => executorIds.Contains(profile.UserId) && profile.AvatarKey != null)
            .ToDictionaryAsync(
                profile => profile.UserId,
                profile => profile.AvatarKey!,
                cancellationToken
            );

        if (avatarKeys.Count == 0)
            return;

        for (var i = 0; i < items.Count; i++)
        {
            if (
                items[i].ExecutedById is { } executedById
                && avatarKeys.TryGetValue(executedById, out var avatarKey)
            )
            {
                var url = await storage.GetPresignedUrlAsync(
                    avatarKey,
                    TimeSpan.FromMinutes(60),
                    cancellationToken
                );
                items[i] = items[i] with { ExecutedByAvatarUrl = url };
            }
        }
    }
}
