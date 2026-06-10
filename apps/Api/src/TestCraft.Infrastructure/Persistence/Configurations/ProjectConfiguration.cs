using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("projects");

        builder.HasKey(p => p.Id);
        builder
            .Property(p => p.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder
            .Property(p => p.Name)
            .HasColumnName("name")
            .HasMaxLength(255)
            .IsRequired();
        builder.Property(p => p.Description).HasColumnName("description");
        builder.Property(p => p.UserId).HasColumnName("user_id");
        builder
            .Property(p => p.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(p => p.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(p => p.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(p => p.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => new { p.UserId, p.Name }).IsUnique();

        builder.HasQueryFilter(p => !p.IsDeleted);

        builder
            .HasMany(p => p.TestSuites)
            .WithOne(s => s.Project)
            .HasForeignKey(s => s.ProjectId);

        builder
            .HasMany(p => p.TestRuns)
            .WithOne(r => r.Project)
            .HasForeignKey(r => r.ProjectId);
    }
}
