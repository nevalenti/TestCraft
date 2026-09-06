using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class TestCaseStepConfiguration : IEntityTypeConfiguration<TestCaseStep>
{
    public void Configure(EntityTypeBuilder<TestCaseStep> builder)
    {
        builder.ToTable("test_case_steps");

        builder.ConfigureGeneratedId(step => step.Id);

        builder.Property(step => step.Order).HasColumnName("order");

        builder.Property(step => step.Action).HasColumnName("action").IsRequired();

        builder.Property(step => step.ExpectedResult).HasColumnName("expected_result").IsRequired();

        builder.Property(step => step.TestCaseId).HasColumnName("test_case_id");

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder.HasIndex(step => step.TestCaseId);
    }
}
