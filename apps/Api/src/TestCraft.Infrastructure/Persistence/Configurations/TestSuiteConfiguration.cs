using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestSuiteConfiguration : IEntityTypeConfiguration<TestSuite>
{
    public void Configure(EntityTypeBuilder<TestSuite> builder)
    {
        builder.ToTable("test_suites");

        builder.HasKey(testSuite => testSuite.Id);
        builder
            .Property(testSuite => testSuite.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(testSuite => testSuite.Name).HasColumnName("name").IsRequired();
        builder.Property(testSuite => testSuite.Description).HasColumnName("description");
        builder.Property(testSuite => testSuite.Source).HasColumnName("source");
        builder.Property(testSuite => testSuite.ProjectId).HasColumnName("project_id");
        builder
            .Property(testSuite => testSuite.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testSuite => testSuite.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(testSuite => testSuite.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(testSuite => testSuite.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(testSuite => testSuite.ProjectId);

        builder.HasQueryFilter(testSuite => !testSuite.IsDeleted);

        builder
            .HasMany(testSuite => testSuite.TestCases)
            .WithOne(testCase => testCase.Suite)
            .HasForeignKey(testCase => testCase.SuiteId);
    }
}
