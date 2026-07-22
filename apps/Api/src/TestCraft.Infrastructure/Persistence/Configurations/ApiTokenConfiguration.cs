using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ApiTokenConfiguration : IEntityTypeConfiguration<ApiToken>
{
    public void Configure(EntityTypeBuilder<ApiToken> builder)
    {
        builder.ToTable("api_tokens");

        builder.HasKey(apiToken => apiToken.Id);
        builder
            .Property(apiToken => apiToken.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(apiToken => apiToken.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();
        builder
            .Property(apiToken => apiToken.TokenHash)
            .HasColumnName("token_hash")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(apiToken => apiToken.ProjectId).HasColumnName("project_id");
        builder.Property(apiToken => apiToken.CreatedById).HasColumnName("created_by_id");
        builder.Property(apiToken => apiToken.LastUsedAt).HasColumnName("last_used_at");
        builder.Property(apiToken => apiToken.ExpiresAt).HasColumnName("expires_at");
        builder
            .Property(apiToken => apiToken.IsRevoked)
            .HasColumnName("is_revoked")
            .HasDefaultValue(false);
        builder
            .Property(apiToken => apiToken.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(apiToken => apiToken.TokenHash).IsUnique();
        builder.HasIndex(apiToken => apiToken.ProjectId);
    }
}
