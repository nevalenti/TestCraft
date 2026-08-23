using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestCaseStepConfiguration : IEntityTypeConfiguration<TestCaseStep>
{
    public void Configure(EntityTypeBuilder<TestCaseStep> builder)
    {
        builder.ToTable("test_case_steps");

        builder.HasKey(step => step.Id);
        builder
            .Property(step => step.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(step => step.Order).HasColumnName("order");
        builder.Property(step => step.Action).HasColumnName("action").IsRequired();
        builder.Property(step => step.ExpectedResult).HasColumnName("expected_result").IsRequired();
        builder.Property(step => step.TestCaseId).HasColumnName("test_case_id");
        builder
            .Property(step => step.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");
        builder
            .Property(step => step.UpdatedAt)
            .HasColumnName("updated_at")
            .HasDefaultValueSql("now()");
        builder.Property(step => step.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(step => step.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(step => step.TestCaseId);

        builder.HasQueryFilter(step => !step.IsDeleted);
    }
}
