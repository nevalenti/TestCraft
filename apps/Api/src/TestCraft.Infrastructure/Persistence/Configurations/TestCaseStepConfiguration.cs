using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class TestCaseStepConfiguration : IEntityTypeConfiguration<TestCaseStep>
{
    public void Configure(EntityTypeBuilder<TestCaseStep> builder)
    {
        builder.ToTable("test_case_steps");

        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.Order).HasColumnName("order");
        builder.Property(s => s.Action).HasColumnName("action").IsRequired();
        builder.Property(s => s.ExpectedResult).HasColumnName("expected_result").IsRequired();
        builder.Property(s => s.TestCaseId).HasColumnName("test_case_id");
        builder.Property(s => s.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");
        builder.Property(s => s.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("now()");
        builder.Property(s => s.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        builder.Property(s => s.DeletedAt).HasColumnName("deleted_at");

        builder.HasIndex(s => s.TestCaseId);

        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}
