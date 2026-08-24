using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestCaseConfiguration : IEntityTypeConfiguration<TestCase>
{
    public void Configure(EntityTypeBuilder<TestCase> builder)
    {
        builder.ToTable("test_cases");

        builder.HasKey(testCase => testCase.Id);
        builder
            .Property(testCase => testCase.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(testCase => testCase.Name).HasColumnName("name").IsRequired();
        builder.Property(testCase => testCase.Description).HasColumnName("description");
        builder
            .Property(testCase => testCase.Priority)
            .HasColumnName("priority")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(testCase => testCase.SuiteId).HasColumnName("suite_id");
        builder
            .Property(testCase => testCase.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testCase => testCase.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testCase => testCase.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(testCase => testCase.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(testCase => testCase.SuiteId);
        builder.HasIndex(testCase => testCase.Priority);

        builder.HasQueryFilter(testCase => !testCase.IsDeleted);

        builder
            .HasMany(testCase => testCase.Steps)
            .WithOne(testCaseStep => testCaseStep.TestCase)
            .HasForeignKey(testCaseStep => testCaseStep.TestCaseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasMany(testCase => testCase.TestResults)
            .WithOne(testResult => testResult.TestCase)
            .HasForeignKey(testResult => testResult.TestCaseId);
    }
}
