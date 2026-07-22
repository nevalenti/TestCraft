using MediatR;
using Microsoft.EntityFrameworkCore;
using TestCraft.Application.Common.Interfaces;

namespace TestCraft.Application.Users;

public static class GetAvatarUrl
{
    /// <summary>Requests a presigned URL for the current user's avatar, if one is set.</summary>
    public sealed record Query : IRequest<AvatarUrlResponse?>;

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IStorageService storage
    ) : IRequestHandler<Query, AvatarUrlResponse?>
    {
        public async Task<AvatarUrlResponse?> Handle(
            Query request,
            CancellationToken cancellationToken
        )
        {
            var userId = currentUser.UserId;

            var profile = await context
                .UserProfiles.AsNoTracking()
                .FirstOrDefaultAsync(
                    userProfile => userProfile.UserId == userId,
                    cancellationToken
                );

            if (profile?.AvatarKey is null)
                return null;

            var url = await storage.GetPresignedUrlAsync(
                profile.AvatarKey,
                TimeSpan.FromMinutes(60),
                cancellationToken
            );

            return new AvatarUrlResponse { Url = url };
        }
    }
}
