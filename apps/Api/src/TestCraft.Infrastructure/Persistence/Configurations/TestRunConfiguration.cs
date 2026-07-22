using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestRunConfiguration : IEntityTypeConfiguration<TestRun>
{
    public void Configure(EntityTypeBuilder<TestRun> builder)
    {
        builder.ToTable("test_runs");

        builder.HasKey(testRun => testRun.Id);
        builder
            .Property(testRun => testRun.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
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
        builder
            .Property(testRun => testRun.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testRun => testRun.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testRun => testRun.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(testRun => testRun.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(testRun => testRun.ProjectId);

        builder.HasQueryFilter(testRun => !testRun.IsDeleted);

        builder
            .HasMany(testRun => testRun.TestResults)
            .WithOne(tr => tr.TestRun)
            .HasForeignKey(tr => tr.TestRunId);
    }
}
