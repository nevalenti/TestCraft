using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> builder)
    {
        builder.ToTable("test_cases");

        builder.HasKey(c => c.Id);
        builder
            .Property(c => c.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(c => c.Name).HasColumnName("name").IsRequired();
        builder.Property(c => c.Description).HasColumnName("description");
        builder
            .Property(c => c.Priority)
            .HasColumnName("priority")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(c => c.SuiteId).HasColumnName("suite_id");
        builder
            .Property(c => c.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(c => c.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(c => c.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(c => c.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(c => c.SuiteId);
        builder.HasIndex(c => c.Priority);

        builder.HasQueryFilter(c => !c.IsDeleted);

        builder
            .HasMany(c => c.Steps)
            .WithOne(s => s.TestCase)
            .HasForeignKey(s => s.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasMany(c => c.TestResults)
            .WithOne(r => r.TestCase)
            .HasForeignKey(r => r.TestCaseId);
    }
}
