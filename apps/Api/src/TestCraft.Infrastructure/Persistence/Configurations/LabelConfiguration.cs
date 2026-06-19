using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Infrastructure.Persistence.Configurations;

public class LabelConfiguration : IEntityTypeConfiguration<Label>
{
    public void Configure(EntityTypeBuilder<Label> builder)
    {
        builder.ToTable("labels");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id").HasDefaultValueSql("gen_random_uuid()");
        builder.Property(l => l.Name).HasColumnName("name").HasMaxLength(50).IsRequired();
        builder.Property(l => l.Color).HasColumnName("color").HasMaxLength(7).IsRequired();
        builder.Property(l => l.ProjectId).HasColumnName("project_id");
        builder.Property(l => l.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("now()");

        builder.HasIndex(l => new { l.ProjectId, l.Name }).IsUnique();
    }
}
