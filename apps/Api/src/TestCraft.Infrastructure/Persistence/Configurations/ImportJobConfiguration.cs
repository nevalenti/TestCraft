using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class ImportJobConfiguration : IEntityTypeConfiguration<ImportJob>
{
    public void Configure(EntityTypeBuilder<ImportJob> builder)
    {
        builder.ToTable("import_jobs");

        builder.HasKey(j => j.Id);
        builder.Property(j => j.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(j => j.ProjectId).HasColumnName("project_id");
        builder
            .Property(j => j.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(j => j.TestRunId).HasColumnName("test_run_id");
        builder.Property(j => j.Error).HasColumnName("error").HasMaxLength(5000);
        builder.Property(j => j.CreatedById).HasColumnName("created_by_id");
        builder.Property(j => j.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(j => j.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");

        builder.HasIndex(j => j.ProjectId);

        builder
            .HasOne<Project>()
            .WithMany()
            .HasForeignKey(j => j.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne<TestRun>()
            .WithMany()
            .HasForeignKey(j => j.TestRunId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
