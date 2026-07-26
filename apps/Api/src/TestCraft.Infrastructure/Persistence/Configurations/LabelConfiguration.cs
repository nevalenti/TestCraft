using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("labels");

        builder.HasKey(label => label.Id);
        builder
            .Property(label => label.Id)
            .HasColumnName("id")
            .HasDefaultValueSql("gen_random_uuid()");
        builder.Property(label => label.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
        builder.Property(label => label.Color).HasColumnName("color").HasMaxLength(7).IsRequired();
        builder.Property(label => label.ProjectId).HasColumnName("project_id");
        builder
            .Property(label => label.CreatedAt)
            .HasColumnName("created_at")
            .HasDefaultValueSql("now()");

        builder.HasIndex(label => new { label.ProjectId, label.Name }).IsUnique();

        builder.HasQueryFilter(label => !label.Project!.IsDeleted);
    }
}
