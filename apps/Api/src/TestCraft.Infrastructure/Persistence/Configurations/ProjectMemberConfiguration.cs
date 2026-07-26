using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ProjectMemberConfiguration : IEntityTypeConfiguration<ProjectMember>
{
    public void Configure(EntityTypeBuilder<ProjectMember> builder)
    {
        builder.ToTable("project_members");

        builder.HasKey(projectMember => projectMember.Id);
        builder
            .Property(projectMember => projectMember.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(projectMember => projectMember.ProjectId).HasColumnName("project_id");
        builder.Property(projectMember => projectMember.UserId).HasColumnName("user_id");
        builder
            .Property(projectMember => projectMember.Email)
            .HasColumnName("email")
            .HasMaxLength(254)
            .IsRequired();
        builder
            .Property(projectMember => projectMember.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(255);
        builder
            .Property(projectMember => projectMember.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder
            .HasIndex(projectMember => new { projectMember.ProjectId, projectMember.UserId })
            .IsUnique();

        builder.HasQueryFilter(projectMember => !projectMember.Project!.IsDeleted);
    }
}
