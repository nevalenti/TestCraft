using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestRunConfiguration : IEntityTypeConfiguration<TestRun>
{
    public void Configure(EntityTypeBuilder<TestRun> builder)
    {
        builder.ToTable("test_runs");

        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(r => r.Name).HasColumnName("name").IsRequired();
        builder.Property(r => r.Environment).HasColumnName("environment").IsRequired();
        builder
            .Property(r => r.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(r => r.Source).HasColumnName("source");
        builder.Property(r => r.ExecutedById).HasColumnName("executed_by_id");
        builder.Property(r => r.ExecutedByName).HasColumnName("executed_by_name").HasMaxLength(255);
        builder.Property(r => r.ProjectId).HasColumnName("project_id");
        builder.Property(r => r.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        builder.Property(r => r.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(r => r.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(r => r.ProjectId);

        builder.HasQueryFilter(r => !r.IsDeleted);

        builder
            .HasMany(r => r.TestResults)
            .WithOne(tr => tr.TestRun)
            .HasForeignKey(tr => tr.TestRunId);
    }
}
