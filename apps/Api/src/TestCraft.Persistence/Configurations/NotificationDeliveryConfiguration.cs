using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

using TestCraft.Domain.Entities;

namespace TestCraft.Persistence.Configurations;

public class NotificationDeliveryConfiguration : IEntityTypeConfiguration<NotificationDelivery>
{
    public void Configure(EntityTypeBuilder<NotificationDelivery> builder)
    {
        builder.ToTable("notification_deliveries");

        builder.ConfigureGeneratedId(delivery => delivery.Id);
        builder.Property(delivery => delivery.ProjectId).HasColumnName("project_id");
        builder
            .Property(delivery => delivery.Channel)
            .HasColumnName("channel")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder
            .Property(delivery => delivery.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(100)
            .IsRequired();
        builder
            .Property(delivery => delivery.Target)
            .HasColumnName("target")
            .HasMaxLength(2000)
            .IsRequired();
        builder.Property(delivery => delivery.Payload).HasColumnName("payload").IsRequired();
        builder.Property(delivery => delivery.Secret).HasColumnName("secret").HasMaxLength(200);
        builder
            .Property(delivery => delivery.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(20);
        builder.Property(delivery => delivery.AttemptCount).HasColumnName("attempt_count");
        builder.Property(delivery => delivery.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(delivery => delivery.LastError).HasColumnName("last_error");
        builder.Property(delivery => delivery.CreatedAt).HasColumnName("created_at");
        builder.Property(delivery => delivery.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(delivery => new { delivery.Status, delivery.NextAttemptAt });
    }
}
