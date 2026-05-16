using Domain.Entities;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Configurations;

public class TestSuiteConfiguration : IEntityTypeConfiguration<TestSuite>
{
    public void Configure(EntityTypeBuilder<TestSuite> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(s => s.Name).IsRequired().HasMaxLength(255);
        builder.HasQueryFilter(s => !s.IsDeleted);
        builder.HasIndex(s => s.ProjectId);

        builder.HasMany(s => s.TestCases)
            .WithOne(c => c.Suite)
            .HasForeignKey(c => c.SuiteId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}