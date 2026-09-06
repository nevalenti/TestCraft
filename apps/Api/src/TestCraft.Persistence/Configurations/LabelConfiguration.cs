using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("labels");

        builder.ConfigureGeneratedId(label => label.Id);

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
