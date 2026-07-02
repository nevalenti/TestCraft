using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.ToTable("project_members");

        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(m => m.ProjectId).HasColumnName("project_id");
        builder.Property(m => m.UserId).HasColumnName("user_id");
        builder.Property(m => m.Email).HasColumnName("email").HasMaxLength(254).IsRequired();
        builder.Property(m => m.DisplayName).HasColumnName("display_name").HasMaxLength(255);
        builder.Property(m => m.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(m => new { m.ProjectId, m.UserId }).IsUnique();
    }
}
