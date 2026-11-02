using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.ToTable("notes");

        builder.ConfigureVersion();

        builder.ConfigureGeneratedId(note => note.Id);

        builder.Property(note => note.ProjectId).HasColumnName("project_id");

        builder.Property(note => note.OwnerId).HasColumnName("owner_id");

        builder.Property(note => note.Title).HasColumnName("title").HasMaxLength(255).IsRequired();

        builder
            .Property(note => note.Language)
            .HasColumnName("language")
            .HasMaxLength(50)
            .IsRequired();

        builder
            .Property(note => note.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(note => note.SizeBytes).HasColumnName("size_bytes");

        builder
            .Property(note => note.Excerpt)
            .HasColumnName("excerpt")
            .HasMaxLength(NoteExcerpt.Length)
            .IsRequired();

        builder.ConfigureAuditTimestamps();

        builder.ConfigureSoftDelete();

        builder.HasIndex(note => note.ProjectId);

        builder.HasIndex(note => note.OwnerId);

        builder
            .HasOne(note => note.Project)
            .WithMany()
            .HasForeignKey(note => note.ProjectId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
