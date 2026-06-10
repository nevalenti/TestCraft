using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestSuiteConfiguration : IEntityTypeConfiguration<TestSuite>
{
    public void Configure(EntityTypeBuilder<TestSuite> builder)
    {
        builder.ToTable("test_suites");

        builder.HasKey(s => s.Id);
        builder
            .Property(s => s.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.Name).HasColumnName("name").IsRequired();
        builder.Property(s => s.Description).HasColumnName("description");
        builder.Property(s => s.Source).HasColumnName("source");
        builder.Property(s => s.ProjectId).HasColumnName("project_id");
        builder
            .Property(s => s.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(s => s.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(s => s.IsDeleted)
            .HasColumnName("is_deleted")
            .HasDefaultValue(false);
        builder.Property(s => s.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(s => s.ProjectId);

        builder.HasQueryFilter(s => !s.IsDeleted);

        builder
            .HasMany(s => s.TestCases)
            .WithOne(c => c.Suite)
            .HasForeignKey(c => c.SuiteId);
    }
}
