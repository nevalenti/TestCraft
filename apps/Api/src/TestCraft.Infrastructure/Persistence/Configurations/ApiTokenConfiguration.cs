using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ApiTokenConfiguration : IEntityTypeConfiguration<ApiToken>
{
    public void Configure(EntityTypeBuilder<ApiToken> builder)
    {
        builder.ToTable("api_tokens");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(t => t.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder
            .Property(t => t.TokenHash)
            .HasColumnName("token_hash")
            .HasMaxLength(64)
            .IsRequired();
        builder.Property(t => t.ProjectId).HasColumnName("project_id");
        builder.Property(t => t.CreatedById).HasColumnName("created_by_id");
        builder.Property(t => t.LastUsedAt).HasColumnName("last_used_at");
        builder.Property(t => t.ExpiresAt).HasColumnName("expires_at");
        builder.Property(t => t.IsRevoked).HasColumnName("is_revoked").HasDefaultValue(false);
        builder.Property(t => t.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasIndex(t => t.ProjectId);
    }
}
