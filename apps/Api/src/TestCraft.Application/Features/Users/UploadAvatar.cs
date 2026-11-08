using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TestCraft.Application.Common.Extensions;
using TestCraft.Application.Common.Interfaces;
using TestCraft.Application.Common.Validation;
using TestCraft.Domain.Entities;

namespace TestCraft.Application.Features.Users;

/// <summary>A presigned URL for a user's avatar image.</summary>
public record AvatarUrlResponse
{
    /// <summary>A temporary URL for the avatar, valid for one hour; null when there is none.</summary>
    public required string? Url { get; init; }
}

public static class UploadAvatar
{
    /// <summary>Uploads a new avatar for the current user, replacing any existing one.</summary>
    public sealed record Command : IRequest<AvatarUrlResponse>
    {
        /// <summary>The original file name.</summary>
        public required string FileName { get; init; }

        /// <summary>The file's MIME type.</summary>
        public required string ContentType { get; init; }

        /// <summary>The file size, in bytes.</summary>
        public required long SizeBytes { get; init; }

        /// <summary>The file content stream.</summary>
        public required Stream Content { get; init; }
    }

    private static readonly string[] AllowedContentTypes =
    [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    public const long MaxSizeBytes = 5_242_880;

    public sealed class Validator : AbstractValidator<Command>
    {
        public Validator()
        {
            RuleFor(command => command.FileName).NotEmpty().MaximumLength(FieldLengths.Name);
            RuleFor(command => command.ContentType)
                .NotEmpty()
                .Must(contentType => AllowedContentTypes.Contains(contentType))
                .WithMessage("Avatar must be a JPEG, PNG, WebP, or GIF image");
            RuleFor(command => command.SizeBytes)
                .GreaterThan(0)
                .LessThanOrEqualTo(MaxSizeBytes)
                .WithMessage("File size must not exceed 5 MB");
        }
    }

    public sealed class Handler(
        IApplicationDbContext context,
        ICurrentUser currentUser,
        IStorageService storage,
        ILogger<Handler> logger
    ) : IRequestHandler<Command, AvatarUrlResponse>
    {
        public async Task<AvatarUrlResponse> Handle(
            Command request,
            CancellationToken cancellationToken
        )
        {
            var userId = currentUser.UserId;

            var profile = await context.UserProfiles.FirstOrDefaultAsync(
                userProfile => userProfile.UserId == userId,
                cancellationToken
            );

            var previousKey = profile?.AvatarKey;
            var storageKey = StorageExtensions.NewKey($"avatars/{userId}", request.FileName);

            await storage.UploadAsync(
                storageKey,
                request.Content,
                request.ContentType,
                cancellationToken
            );

            if (profile is null)
            {
                profile = UserProfile.Create(userId, storageKey);

                context.UserProfiles.Add(profile);
            }
            else
            {
                profile.SetAvatarKey(storageKey);
            }

            await context.SaveChangesOrDiscardAsync(storage, storageKey, cancellationToken);

            if (previousKey is not null)
            {
                await storage.DeleteReplacedAsync(previousKey, logger);
            }

            var url = await storage.GetPresignedUrlAsync(
                storageKey,
                TimeSpan.FromMinutes(60),
                cancellationToken
            );

            return new AvatarUrlResponse { Url = url };
        }
    }
}
