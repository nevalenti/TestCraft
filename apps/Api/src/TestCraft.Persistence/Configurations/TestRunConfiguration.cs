using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestRunConfiguration : IEntityTypeConfiguration<TestRun>
{
    public void Configure(EntityTypeBuilder<TestRun> builder)
    {
        builder.ToTable("test_runs");

        builder.ConfigureGeneratedId(testRun => testRun.Id);
        builder.Property(testRun => testRun.Name).HasColumnName("name").IsRequired();
        builder.Property(testRun => testRun.Environment).HasColumnName("environment").IsRequired();
        builder
            .Property(testRun => testRun.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(testRun => testRun.Source).HasColumnName("source");
        builder.Property(testRun => testRun.ExecutedById).HasColumnName("executed_by_id");
        builder
            .Property(testRun => testRun.ExecutedByName)
            .HasColumnName("executed_by_name")
            .HasMaxLength(255);
        builder.Property(testRun => testRun.ProjectId).HasColumnName("project_id");
        builder.ConfigureAuditTimestamps();
        builder.ConfigureSoftDelete();

        builder.HasIndex(testRun => testRun.ProjectId);

        builder
            .HasMany(testRun => testRun.TestResults)
            .WithOne(tr => tr.TestRun)
            .HasForeignKey(tr => tr.TestRunId);
    }
}
