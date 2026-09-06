using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class ImportJobConfiguration : IEntityTypeConfiguration<ImportJob>
{
    public void Configure(EntityTypeBuilder<ImportJob> builder)
    {
        builder.ToTable("import_jobs");

        builder.ConfigureGeneratedId(importJob => importJob.Id);

        builder.Property(importJob => importJob.ProjectId).HasColumnName("project_id");

        builder
            .Property(importJob => importJob.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(importJob => importJob.TestRunId).HasColumnName("test_run_id");

        builder.Property(importJob => importJob.Error).HasColumnName("error").HasMaxLength(5000);

        builder.Property(importJob => importJob.CreatedById).HasColumnName("created_by_id");

        builder.ConfigureAuditTimestamps();

        builder.HasIndex(importJob => importJob.ProjectId);

        builder
            .HasOne<Project>()
            .WithMany()
            .HasForeignKey(importJob => importJob.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne<TestRun>()
            .WithMany()
            .HasForeignKey(importJob => importJob.TestRunId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
